// app/head.tsx
export default function Head() {
  return (
    <>
      <title>India–Pakistan Tension News</title>
      <meta
        name="google-site-verification"
        content={process.env.NEXT_PUBLIC_ADSENSE_PUB_ID!}
      />
      <meta
        name="description"
        content="Latest headlines on India-Pakistan tensions"
      />
    </>
  );
}
