import { ratings } from 'schema/ratings.schema';
import { db } from '../config/database';
import { and, eq } from 'drizzle-orm';
import { games } from 'schema/game.schema';

const K_NEW = 40;
const K_STANDARD = 20;
const PROVISIONAL_GAMES = 20;

function expectedScore(Ra: number, Rb: number): number {
    return 1 / (1 + Math.pow(10, (Rb - Ra) / 400));
}

export class RatingService {
    async updateRatingsForGame(gameId: string) {
        const game = await db.query.games.findFirst({
            where: eq(games.id, gameId)
        });

        if (!game || game.status !== 'completed' || !game.result) return;

        const [whiteRating] = await db
            .select()
            .from(ratings)
            .where(and(
                eq(ratings.userId, parseInt(game.whitePlayerId)),
                eq(ratings.timeControl, game.timeControl)
            ));

        const [blackRating] = await db
            .select()
            .from(ratings)
            .where(and(
                eq(ratings.userId, parseInt(game.blackPlayerId)),
                eq(ratings.timeControl, game.timeControl)
            ));

        if (!whiteRating || !blackRating) return;

        const Ra = whiteRating.rating;
        const Rb = blackRating.rating;
        const Ea = expectedScore(Ra, Rb);
        const Eb = expectedScore(Rb, Ra);

        let Sa = 0.5;
        let Sb = 0.5;

        if (game.result === 'white_wins') {
            Sa = 1; Sb = 0;
        } else if (game.result === 'black_wins') {
            Sa = 0; Sb = 1;
        }

        const Ka =
            whiteRating.gamesPlayed < PROVISIONAL_GAMES ? K_NEW : K_STANDARD;
        const Kb =
            blackRating.gamesPlayed < PROVISIONAL_GAMES ? K_NEW : K_STANDARD;

        const newRa = Math.round(Ra + Ka * (Sa - Ea));
        const newRb = Math.round(Rb + Kb * (Sb - Eb));

        await db
            .update(ratings)
            .set({
                rating: newRa,
                gamesPlayed: whiteRating.gamesPlayed + 1,
                wins: whiteRating.wins + (Sa === 1 ? 1 : 0),
                losses: whiteRating.losses + (Sa === 0 ? 1 : 0),
                draws: whiteRating.draws + (Sa === 0.5 ? 1 : 0)
            })
            .where(eq(ratings.id, whiteRating.id));

        await db
            .update(ratings)
            .set({
                rating: newRb,
                gamesPlayed: blackRating.gamesPlayed + 1,
                wins: blackRating.wins + (Sb === 1 ? 1 : 0),
                losses: blackRating.losses + (Sb === 0 ? 1 : 0),
                draws: blackRating.draws + (Sb === 0.5 ? 1 : 0)
            })
            .where(eq(ratings.id, blackRating.id));
    }
}

export const ratingService = new RatingService();
