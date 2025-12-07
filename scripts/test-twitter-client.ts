import "dotenv/config";
import { searchBrandContext } from "../lib/twitterClient";

async function testTwitterFetch() {
  const BRAND = "Tesla";
  console.log(`🚀 Fetching real data for @${BRAND} from Twitter API...`);

  try {
    const { publicMentions, brandVisualPosts } = await searchBrandContext(BRAND, 10);

    console.log(`\n✅ Fetched ${publicMentions.length} Public Mentions:`);
    publicMentions.forEach(t => {
      console.log(`   - @${t.author_id}: ${t.text.replace(/\n/g, ' ').substring(0, 60)}...`);
    });

    console.log(`\n✅ Fetched ${brandVisualPosts.length} Brand Visual Posts (with media):`);
    brandVisualPosts.forEach(t => {
      const mediaCount = t.media?.length || 0;
      const mediaTypes = t.media?.map(m => m.type).join(', ') || 'none';
      console.log(`   - [Media: ${mediaCount} (${mediaTypes})] ${t.text.replace(/\n/g, ' ').substring(0, 60)}...`);
      
      if (mediaCount > 0) {
        console.log(`     📸 URL: ${t.media![0].url}`);
      }
    });

  } catch (err) {
    console.error("❌ Test Failed:", err);
  }
}

testTwitterFetch();

