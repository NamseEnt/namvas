export function getImageUrl(imageId: string): string {
  const isLocal = import.meta.env.DEV;
  
  if (isLocal) {
    // 로컬 개발환경: LocalStack path 방식
    return `http://localhost:4566/namvas-local/${imageId}`;
  }
  
  // 프로덕션: S3 도메인 방식
  const bucketName = getS3BucketName();
  return `https://${bucketName}.s3.amazonaws.com/${imageId}`;
}

function getS3BucketName(): string {
  const bucketName = import.meta.env.VITE_S3_BUCKET_NAME;

  if (!bucketName) {
    throw new Error("VITE_S3_BUCKET_NAME 환경변수가 설정되지 않았습니다.");
  }

  return bucketName;
}
