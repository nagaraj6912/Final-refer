import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import Link from 'next/link';

// Define the Blog Post type
type Post = {
  id: string;
  title: string;
  created_at: string;
  // Add other fields from your 'blogs' table if you have them
};

async function getBlogPosts() {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('blogs') // Assumes you have a 'blogs' table
    .select('id, title, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
  return data;
}

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <div className="container mx-auto max-w-3xl p-4">
      <h1 className="text-4xl font-bold mb-8 text-center">QuickEarn Blog</h1>
      
      <div className="space-y-6">
        {posts.map((post: Post) => (
          <Link href={`/blog/${post.id}`} key={post.id} className="block p-6 bg-base-100 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold text-primary">{post.title}</h2>
            <p className="text-sm text-gray-500 mt-2">
              Published on: {new Date(post.created_at).toLocaleDateString()}
            </p>
          </Link>
        ))}
        {posts.length === 0 && (
          <p className="text-center text-gray-600">No blog posts found.</p>
        )}
      </div>
    </div>
  );
}