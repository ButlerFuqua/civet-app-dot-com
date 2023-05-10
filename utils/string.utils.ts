export const getFriendlyDateString = (dateString: string): string => {
    return (new Date(dateString)).toDateString();
}