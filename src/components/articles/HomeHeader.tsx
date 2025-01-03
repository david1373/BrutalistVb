interface HomeHeaderProps {
  category: string;
  date: string;
}

export function HomeHeader({ category, date }: HomeHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h2 className="text-2xl font-bold">{category}</h2>
        <p className="text-gray-600">{date}</p>
      </div>
    </div>
  );
}