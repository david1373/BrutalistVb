export interface Article {
  id: string;
  title: string;
  content: string;
  image: string;
  author: string;
  date: Date;
  isSubscriberOnly: boolean;
}

export interface ArticlePreview extends Pick<Article, 'id' | 'title' | 'image' | 'author' | 'date'> {
  excerpt: string;
}