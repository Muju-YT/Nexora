export const getMediaUrl = (url) => {
  if (!url) return '';
  
  // If the url contains '/media/', extract from '/media/' onwards and prepend VITE_API_URL
  const mediaIndex = url.indexOf('/media/');
  if (mediaIndex !== -1) {
    return `${import.meta.env.VITE_API_URL}${url.substring(mediaIndex)}`;
  }
  
  const staticIndex = url.indexOf('/static/');
  if (staticIndex !== -1) {
    return `${import.meta.env.VITE_API_URL}${url.substring(staticIndex)}`;
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  return `${import.meta.env.VITE_API_URL}${url}`;
};

export const getAvatarUrl = (avatar) => {
  if (!avatar) return null;
  
  const mediaIndex = avatar.indexOf('/media/');
  if (mediaIndex !== -1) {
    return `${import.meta.env.VITE_API_URL}${avatar.substring(mediaIndex)}`;
  }
  
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar;
  }
  
  return `${import.meta.env.VITE_API_URL}${avatar}`;
};
