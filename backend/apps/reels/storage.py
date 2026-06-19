from cloudinary_storage.storage import MediaCloudinaryStorage
import cloudinary.uploader


class VideoCloudinaryStorage(MediaCloudinaryStorage):
    RESOURCE_TYPE = 'video'

    def _save(self, name, content):
        result = cloudinary.uploader.upload(
            content,
            resource_type="video",
            folder="reels"
        )

        return result["public_id"] + "." + result["format"]
