const publicDocument = (document) => ({
  title: document.title,
  titleBn: document.titleBn,
  description: document.description,
  category: document.category,
  slug: document.slug,
  publishedAt: document.publishedAt,
  file: {
    originalName: document.file?.originalName,
    mimeType: document.file?.mimeType,
    extension: document.file?.extension,
    size: document.file?.size,
  },
});

const fileMetadata = (file) => ({
  originalName: file?.originalName,
  mimeType: file?.mimeType,
  extension: file?.extension,
  size: file?.size,
  checksum: file?.checksum,
});

const adminDocument = (document) => {
  const value = document.toObject ? document.toObject() : document;
  return { ...value, file: fileMetadata(value.file) };
};

const adminVersion = (version) => {
  const value = version.toObject ? version.toObject() : version;
  return { ...value, file: fileMetadata(value.file) };
};

module.exports = { publicDocument, fileMetadata, adminDocument, adminVersion };
