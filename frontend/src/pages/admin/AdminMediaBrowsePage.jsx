import { useParams } from 'react-router';
import { MediaBrowser } from '@/features/media';

/** Ảnh của một thư mục (`/admin/media/folders/:folder`) hoặc mọi ảnh (`/admin/media/all`). */
export function AdminMediaBrowsePage() {
  const { folder } = useParams();
  return <MediaBrowser folder={folder} />;
}
