llrt는 런타임일 뿐이다.

http server가 llrt 안에는 없다.

로컬 개발 환경에서 llrt로 aws lambda function url 를 에뮬레이션 하는 방법이 필요하다.

http server는 fs, fetch는 있다.

http server를 따로 띄운 후, llrt에서 돌아가는 코드가 지속적으로 http server에 요청하여 프록시 해주는 방법 밖에 없는걸까?

local-lambda-emulator

- lambda emulator임.
- bun 을 기본으로 사용함.
- 환경에 맞는 llrt를 설치함. 이미 설치되어있으면 패스.
  - https://github.com/awslabs/llrt/releases
- http server를 열어 http 요청이 들어오면 llrt를 실행하고, llrt는 http server에 req 정보를 달라고 하고, 처리로 response를 http server에 제공함. http server는 그걸 다시 http 요청한 자에게 제공함. (브라우저 <-> http-server <-> llrt)
- esbuild를 llrt가 쓸 타입스크립트 코드에 대해 watch 걸어놓음
  - esbuild index.js --platform=browser --target=es2023 --format=esm --bundle --minify --external:@aws-sdk --external:@smithy
- llrt가 쓰는 코드는 aws lambda에 올라갈때의 handler랑, 위의 에뮬레이션용이랑 entry가 다름.

로컬용 entry = 켜지면 서버에 fetch하여 req 받아와 api 처리 후 res로 보내줌
람다용 entry = 평범한 export default handler(event, context) 같은 api gateway식.

local-lambda-emulator
be

이렇게 2개로 디렉토리를 쪼개자.
