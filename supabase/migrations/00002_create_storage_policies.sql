-- Enable Storage for article images
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-images', 'article-images', true);

-- Policy for reading images (public)
CREATE POLICY "Article images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'article-images');

-- Policy for uploading images (authenticated users)
CREATE POLICY "Authenticated users can upload article images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'article-images' 
        AND auth.role() = 'authenticated'
    );

-- Policy for deleting images (authenticated users)
CREATE POLICY "Authenticated users can delete article images"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'article-images'
        AND auth.role() = 'authenticated'
    );
