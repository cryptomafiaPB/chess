export const COUNTRIES = [
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'IN', name: 'India' },
    { code: 'BR', name: 'Brazil' },
    { code: 'AU', name: 'Australia' },
    { code: 'JP', name: 'Japan' },
    { code: 'KR', name: 'South Korea' },
    { code: 'RU', name: 'Russia' },
    { code: 'CN', name: 'China' },
    { code: 'MX', name: 'Mexico' },
    { code: 'ES', name: 'Spain' },
    { code: 'IT', name: 'Italy' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'PL', name: 'Poland' },
    { code: 'SE', name: 'Sweden' },
    { code: 'NO', name: 'Norway' },
    { code: 'FI', name: 'Finland' },
];

const defaultCountryFlag = 'https://static.vecteezy.com/system/resources/thumbnails/068/599/133/large/editorial-one-piece-symbol-waving-flag-green-screen-background-free-video.jpg';


export const getCountryFlag = (countryCode: string | null | undefined) => {
    // if (!countryCode) return null;
    // const codePoints = countryCode
    //     .toUpperCase()
    //     .split('')
    //     .map((char) => 127397 + char.charCodeAt(0));
    // console.log("countryCode:", countryCode, "codePoints:", codePoints, "flag:", String.fromCodePoint(...codePoints));
    // return String.fromCodePoint(...codePoints);

    if (!countryCode) return defaultCountryFlag;

    const flag = `https://flagcdn.com/w320/${countryCode.toLowerCase()}.png`;
    return flag;
};