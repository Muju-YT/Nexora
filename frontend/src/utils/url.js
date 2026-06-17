export const getMediaUrl = (url) => {
  if (!url) return '';
  
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If the url contains '/media/', extract from '/media/' onwards and prepend VITE_API_URL
  const mediaIndex = url.indexOf('/media/');
  if (mediaIndex !== -1) {
    return `${import.meta.env.VITE_API_URL}${url.substring(mediaIndex)}`;
  }
  
  const staticIndex = url.indexOf('/static/');
  if (staticIndex !== -1) {
    return `${import.meta.env.VITE_API_URL}${url.substring(staticIndex)}`;
  }
  
  return `${import.meta.env.VITE_API_URL}${url}`;
};

export const getAvatarUrl = (avatar) => {
  if (!avatar) return null;
  
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar;
  }
  
  const mediaIndex = avatar.indexOf('/media/');
  if (mediaIndex !== -1) {
    return `${import.meta.env.VITE_API_URL}${avatar.substring(mediaIndex)}`;
  }
  
  return `${import.meta.env.VITE_API_URL}${avatar}`;
};
