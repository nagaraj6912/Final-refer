import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { notFound } from 'next/navigation';

type PostPageProps = {
  params: {
    id: string; // This 'id' comes from the folder name [id]
  };
};

async function getPost(id: string) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching post:', error);
    notFound(); // Triggers a 404 page
  }
  return data;
}

export default async function PostPage({ params }: PostPageProps) {
  const post = await getPost(params.id);

  return (
    <div className="container mx-auto max-w-3xl p-4">
      <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
      <p className="text-gray-500 mb-8">
        Published on: {new Date(post.created_at).toLocaleDateString()}
      </p>
      
      {/* This will render the blog content */}
      <div className="prose lg:prose-xl max-w-none">
        {/* If your content is plain text, wrap it in <p> */}
        <p>{post.content}</p>
        {/* If it's Markdown, you'd use a Markdown renderer here */}
      </div>
    </div>
  );
}