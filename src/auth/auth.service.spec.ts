import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

// describe -> 그루핑을 할 때 사용
// 특정 서비스, 컨트롤러의 요소들을 그룹해서 사용하겠다
// 각각의 함수별로 아래에서 describe로 다시 묶는게 일반적
describe('AuthService', () => {
  let service: AuthService;
  // 테스트를 실행할 때 마다 매번 실행하는 요소
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthServi ce);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
