// Mock data for demonstration
const mockPosts = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  title: `Post Title ${i + 1}`,
  content: `This is the content of post ${i + 1}. It contains some interesting information about various topics. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
  author: `Author ${i % 10 + 1}`,
  image: `https://picsum.photos/400/240?random=${i + 1}`,
  tags: ['technology', 'news', 'trending', 'featured', 'popular'][i % 5] ? [`tag${i % 5 + 1}`, `tag${(i + 1) % 5 + 1}`, `tag${(i + 2) % 5 + 1}`] : [],
  likes: Math.floor(Math.random() * 1000),
  timestamp: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
}));

class PostService {
  static async getAll({
    page,
    itemsPerPage,
    refresh,
    searchQuery
  }: {
    page: number;
    itemsPerPage: number;
    refresh: boolean;
    searchQuery?: string;
  }): Promise<any[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    let filteredPosts = mockPosts;

    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filteredPosts = mockPosts.filter(post =>
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return filteredPosts.slice(startIndex, endIndex);
  }
}

const Services = {
  Post: PostService,
};

export default Services;