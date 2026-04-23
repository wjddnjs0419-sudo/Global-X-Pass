<section id="changgoo-about-section">
  <div class="about-container">
    
    <div class="about-grid">
      
      <div class="about-card card-info">
        <div class="card-title-wrap">
          <span class="card-icon">💡</span>
          <h3>무엇인가요?</h3>
        </div>
        <div class="card-content">
          <p>구글플레이와 중소벤처기업부, 창업진흥원이 공동 운영하는 <strong>대한민국 대표 앱·게임 스타트업 액셀러레이팅 프로그램</strong>입니다. 잠재력 있는 기업을 발굴하여 글로벌 성공 스토리를 함께 만듭니다.</p>
        </div>
      </div>

      <div class="about-card card-benefits">
        <div class="card-title-wrap">
          <span class="card-icon">🚀</span>
          <h3>무엇을 지원하나요?</h3>
        </div>
        <div class="card-content">
          <p>성장 단계별 맞춤형 교육, 구글 전문가 멘토링, 글로벌 마케팅/퍼블리싱 지원, 네트워킹 및 투자 유치 기회 등 <strong>실질적인 스케일업(Scale-up)</strong>을 위한 전방위적 혜택을 제공합니다.</p>
        </div>
      </div>

      <div class="about-card card-history">
        <div class="card-title-wrap">
          <span class="card-icon">📜</span>
          <h3>어떻게 걸어왔나요?</h3>
        </div>
        <div class="card-content">
          <ul class="history-list">
            <li><strong>2019</strong> 프로그램 런칭 (1기 모집)</li>
            <li><strong>2021</strong> 지원 규모 및 혜택 확대</li>
            <li><strong>2023</strong> 누적 참여 기업 400개 돌파</li>
            <li><strong>2026</strong> 8기 모집 및 포털 오픈</li>
          </ul>
        </div>
      </div>

    </div>

    <p class="about-footer-text">창구 프로그램은 당신의 기업이 글로벌 시장에서 PLAY 될 때까지 함께합니다.</p>
  </div>
</section>

<style>
/* 아임웹 환경 제어 */
#prod_상세설명, .fixed-menu-active { overflow: visible !important; }

/* 섹션 전체 스타일 */
#changgoo-about-section {
  position: relative;
  width: 100vw;
  max-width: 100%;
  padding: 60px 0 80px 0; /* 헤더가 없으니 상단 여백을 살짝 줄여서 연결감 부여 */
  background-color: #ffffff;
  font-family: 'Pretendard', sans-serif;
  box-sizing: border-box;
  left: 50%;
  transform: translateX(-50%);
  border-top: 1px solid #eaeaea; /* 히어로 섹션과의 경계선 */
}

/* 컨테이너 */
.about-container {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
  box-sizing: border-box;
}

/* =========================================
   정보 그리드 (여백/높이 완벽 통일)
========================================= */
.about-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 50px;
  align-items: stretch; 
}

/* 개별 카드 */
.about-card {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #eaeaea;
  border-radius: 20px;
  padding: 40px; 
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}

.about-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.05);
}

/* 상단 스트라이프 컬러 */
.about-card::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 6px; }
.card-info::before { background-color: #4285F4; }    
.card-benefits::before { background-color: #34A853; } 
.card-history::before { background-color: #EA4335; }  

/* 타이틀 랩 */
.card-title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px; 
}

.card-icon {
  font-size: 26px;
  line-height: 1;
}

.about-card h3 {
  font-size: 20px;
  font-weight: 700;
  color: #202124;
  margin: 0;
  line-height: 1.2;
}

/* 콘텐츠 영역 */
.card-content {
  flex: 1; 
  display: flex;
  flex-direction: column;
}

.card-content p {
  font-size: 15px;
  color: #5f6368;
  line-height: 1.7; 
  margin: 0;
  word-break: keep-all;
}

.card-content p strong {
  color: #202124;
  font-weight: 600;
}

/* 역사 리스트 스타일 */
.history-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 14px; 
}

.history-list li {
  font-size: 15px; 
  color: #5f6368;
  display: flex;
  align-items: center;
  gap: 12px;
  line-height: 1.4;
}

.history-list li strong {
  color: #4285F4;
  font-weight: 700;
  font-size: 16px;
  min-width: 44px;
}

/* =========================================
   하단 문구
========================================= */
.about-footer-text {
  text-align: center;
  font-size: 16px;
  color: #80868b;
  margin: 0;
  font-weight: 400;
  letter-spacing: -0.01em;
}

/* 모바일 대응 */
@media (max-width: 992px) {
  #changgoo-about-section { padding: 50px 0 60px 0; }
  .about-grid { grid-template-columns: 1fr; gap: 20px; }
  .about-card { padding: 32px; }
}
</style>