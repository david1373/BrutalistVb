import { Share2 } from 'lucide-react';
import { formatDate } from '../utils/date';
import { Link } from 'react-router-dom';

interface NewsCardProps {
  id: string;
  image: string;
  title: string;
  date: Date;
  author: string;
  featured?: boolean;
}

export function NewsCard({ id, image, title, date, author, featured }: NewsCardProps) {
  const fallbackImage = 'https://images.unsplash.com/photo-1485628390555-1a7bd503f9fe?auto=format&fit=crop&q=80&w=800';

  return (
    <Link to={`/articles/${id}`} className="group block">
      <article>
        <div className="relative">
          <img 
            src={image || fallbackImage}
            alt={title}
            className={`w-full object-cover ${featured ? 'h-96' : 'h-48'}`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== fallbackImage) {
                target.src = fallbackImage;
              }
            }}
          />
          <button 
            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.preventDefault();
              navigator.share?.({
                title,
                url: window.location.origin + `/articles/${id}`
              });
            }}
          >
            <Share2 size={16} className="text-white" />
          </button>
        </div>
        <div className="mt-4">
          <h3 className={`font-bold mb-2 ${featured ? 'text-xl' : 'text-base'}`}>{title}</h3>
          <div className="flex justify-between text-sm text-gray-600">
            <span>{formatDate(date)}</span>
            <span>{author}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}