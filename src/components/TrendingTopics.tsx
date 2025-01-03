import { NewsletterForm } from './newsletter/NewsletterForm';

interface TrendingTopicsProps {
  topics: string[];
}

export function TrendingTopics({ topics }: TrendingTopicsProps) {
  return (
    <div className="w-64 space-y-8">
      <div>
        <h3 className="text-xl font-bold mb-4">Trending Topics</h3>
        <ul className="space-y-4">
          {topics.map((topic) => (
            <li key={topic}>
              <a href="#" className="text-gray-800 hover:text-black hover:underline">{topic}</a>
            </li>
          ))}
        </ul>
      </div>
      <NewsletterForm />
    </div>
  );
}