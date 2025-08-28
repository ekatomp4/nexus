const wiki = require('wikipedia');

async function getWiki(pageTitle) {
    try {
        const search = await wiki.search(pageTitle, {suggestion: true, limit: 10});

        // console.log("Search:",search);
        if(search.results.length === 0) return null;
        const topSearchResult = search.results[0];
        const page = await wiki.page(topSearchResult.title);

        // const suggestion = await wiki.suggest(pageTitle);   
        // console.log("Suggestion:", suggestion);
        // const page = await wiki.page(suggestion);

        /*
            const citation = await wiki.citation("batman");
    console.log(random); //Returns citations in an array
    const citationsWiki = await wiki.citation("test", "mediawiki", "fr") ;
    */

        const summary = await page.summary({redirect: true});

        if(!summary) return null;
        return summary.extract;
    } catch (error) {
        console.error("Error fetching Wikipedia page:", error);
        return null;
    }
}

module.exports = getWiki;
