const SITE_NAME = 'Qwizzeria';
const BASE_URL = 'https://qwizzeria.com';
const DEFAULT_DESCRIPTION = 'Turn any gathering into a smart game night. Play beautifully designed quizzes, compete with friends, and host unforgettable quiz sessions.';
const DEFAULT_IMAGE = `${BASE_URL}/qwizzeria-logo.png`;

export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  noIndex = false,
  type = 'website',
}) {
  const fullTitle = !title ? SITE_NAME : title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const canonicalUrl = `${BASE_URL}${path}`;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={DEFAULT_IMAGE} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={DEFAULT_IMAGE} />
    </>
  );
}
