export const permalinkGenerator = (title: string, wordCount: number = 5) => {
    const words = title
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, "")
        .split(" ")
        .filter(Boolean);
    return words.slice(0, wordCount).join("-");
}