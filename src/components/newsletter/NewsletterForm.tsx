import { Button } from '../ui/Button';

export function NewsletterForm() {
  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h4 className="font-bold mb-2">Subscribe to our newsletter</h4>
      <p className="text-sm text-gray-600 mb-4">
        Stay up to date with the latest in architecture and design
      </p>
      <input
        type="email"
        placeholder="Enter your email"
        className="w-full border border-black rounded-lg p-2 mb-2"
      />
      <Button variant="solid" className="w-full">
        Subscribe
      </Button>
    </div>
  );
}