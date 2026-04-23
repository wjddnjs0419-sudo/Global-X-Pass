<div id="orbital-container">
  <div id="orbital-scene">
    <div class="core-node" id="central-core">
      <div class="core-inner-empty"></div>
    </div>

    <div class="orbit-path"></div>
    <div class="orbit-light-wrap inner-light"></div>
    <div class="orbit-path path-outer"></div>
    <div class="orbit-light-wrap outer-light"></div>

    <div id="satellite-nodes">
      <div class="node-item" data-id="1" style="--index: 0;">
        <div class="node-icon-wrap">
          <svg class="node-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
        </div>
        <span class="node-label">공지사항</span>
        <div class="node-card">
          <div class="card-header"><span>NOTICE</span><small>필독</small></div>
          <h5 class="card-title">주요 공지사항</h5>
          <p class="card-p">프로그램 운영 및 지원금 관련<br>중요 안내사항을 확인하세요.</p>
          <div class="card-link" onclick="handleLink('1')">자세히 보기</div>
        </div>
      </div>

      <div class="node-item" data-id="2" style="--index: 1;">
        <div class="node-icon-wrap">
          <svg class="node-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
        <span class="node-label">행사 소식</span>
        <div class="node-card">
          <div class="card-header"><span>EVENT</span><small>일정</small></div>
          <h5 class="card-title">네트워킹 데이 및 세미나</h5>
          <p class="card-p">오프라인 밋업 및 전문가 특강<br>일정을 안내해 드립니다.</p>
          <div class="card-link" onclick="handleLink('2')">자세히 보기</div>
        </div>
      </div>

      <div class="node-item" data-id="3" style="--index: 2;">
        <div class="node-icon-wrap">
          <svg class="node-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <span class="node-label">최신게시물</span>
        <div class="node-card">
          <div class="card-header"><span>UPDATES</span><small>New</small></div>
          <h5 class="card-title">커뮤니티 소식</h5>
          <p class="card-p">창구 프로그램 동문 기업들의<br>최신 근황과 자유로운 소통 공간입니다.</p>
          <div class="card-link" onclick="handleLink('3')">자세히 보기</div>
        </div>
      </div>

      <div class="node-item" data-id="4" style="--index: 3;">
        <div class="node-icon-wrap">
          <svg class="node-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </div>
        <span class="node-label">자료실</span>
        <div class="node-card">
          <div class="card-header"><span>RESOURCE</span><small>다운로드</small></div>
          <h5 class="card-title">가이드 및 VOD</h5>
          <p class="card-p">IR 템플릿, 교육 영상(VOD) 등<br>사업 성장에 필요한 자료 모음입니다.</p>
          <div class="card-link" onclick="handleLink('4')">자세히 보기</div>
        </div>
      </div>

      <div class="node-item" data-id="5" style="--index: 4;">
        <div class="node-icon-wrap">
          <svg class="node-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
        </div>
        <span class="node-label">뉴스레터</span>
        <div class="node-card">
          <div class="card-header"><span>INSIGHT</span><small>구독</small></div>
          <h5 class="card-title">주간 마켓 트렌드</h5>
          <p class="card-p">매주 발행되는 글로벌 시장 동향<br>및 테크 인사이트 레포트입니다.</p>
          <div class="card-link" onclick="handleLink('5')">자세히 보기</div>
        </div>
      </div>
    </div>
  </div>

  <div id="info-panel">
    <div class="panel-tag">PROGRAM INFO</div>
    <h2 class="panel-title">구글 창구 프로그램</h2>
    <p class="panel-desc">
      넥스트챌린지와 구글플레이, 중소벤처기업부, 창업진흥원이 공동 운영하는 <strong>대한민국 대표 앱·게임 스타트업 액셀러레이팅 프로그램</strong>입니다. 잠재력 있는 기업을 발굴하여 글로벌 성공 스토리를 함께 만들어가는데 기여하겠습니다.
    </p>
  </div>
</div>

<style>
/* --- 1. 전역 레이아웃 및 심우주 배경 --- */
#orbital-container {
  position: relative; width: 100vw; max-width: 100%; height: 95vh; min-height: 900px;
  background: 
    radial-gradient(circle at 20% 30%, rgba(40, 20, 80, 0.4) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(20, 40, 80, 0.3) 0%, transparent 50%),
    radial-gradient(circle at center, #16223a 0%, #0c1221 60%, #000000 100%);
  overflow: hidden; display: flex; align-items: center; justify-content: center;
  font-family: 'Pretendard', -apple-system, sans-serif; left: 50%; transform: translateX(-50%);
}

#orbital-scene {
  position: relative; width: 800px; height: 800px; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: transform 1.2s cubic-bezier(0.19, 1, 0.22, 1); z-index: 10;
}
#orbital-container.expanded #orbital-scene { transform: translateX(-22%); }

/* --- 2. 우측 정보 패널 --- */
#info-panel {
  position: absolute; right: -500px; width: 420px; opacity: 0; 
  transition: all 1.2s cubic-bezier(0.19, 1, 0.22, 1); text-align: left; z-index: 20; pointer-events: none;
}
#orbital-container.expanded #info-panel { right: 10%; opacity: 1; pointer-events: auto; }

.panel-tag { font-size: 13px; color: #4285F4; font-weight: 800; letter-spacing: 2px; margin-bottom: 14px; }
.panel-title { font-size: 42px; color: #fff; font-weight: 800; margin: 0 0 24px 0; letter-spacing: -1.5px; }
.panel-desc { font-size: 18px; color: rgba(255, 255, 255, 0.8); line-height: 1.8; word-break: keep-all; }

/* --- 3. 노드 카드 및 텍스트 --- */
.node-card { 
  position: absolute; top: 50%; left: calc(100% + 20px); transform: translateY(-50%) translateX(-15px); 
  width: 320px; background: rgba(18, 22, 31, 0.75); border: 1px solid rgba(255, 255, 255, 0.15); 
  padding: 28px; border-radius: 24px; opacity: 0; pointer-events: none; transition: all 0.4s ease; 
  backdrop-filter: blur(24px); text-align: left; z-index: 200; box-shadow: 0 24px 48px rgba(0, 0, 0, 0.6);
  display: flex; flex-direction: column; gap: 12px;
}
.node-item.active .node-card { opacity: 1; pointer-events: auto; transform: translateY(-50%) translateX(0); }

.card-header { display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 4px; }
.card-header span { font-size: 11px; background: #4285F4; color: #fff; padding: 4px 10px; border-radius: 6px; font-weight: 800; }
.card-header small { color: rgba(255, 255, 255, 0.5); font-size: 13px; font-family: monospace; font-weight: 600; }
.card-title { margin: 0 !important; color: #fff !important; font-size: 21px; font-weight: 800; line-height: 1.3; }
.card-p { margin: 0 !important; color: rgba(255, 255, 255, 0.85) !important; font-size: 15px; line-height: 1.6; word-break: keep-all; }
.card-link { align-self: flex-end; margin-top: 8px; color: #ffffff; font-weight: 800; font-size: 14px; text-decoration: underline; cursor: pointer; transition: opacity 0.2s; }

/* --- 4. 중앙 코어 스타일 (미니멀 광원 링) --- */
.core-node { position: relative; z-index: 100; width: 120px; height: 120px; cursor: pointer; }
.core-node::after { 
  content: ''; position: absolute; top: -5%; left: -5%; width: 110%; height: 110%; 
  border-radius: 50%; border: 2px solid rgba(255, 255, 255, 0.4); 
  box-shadow: 0 0 20px rgba(66, 133, 244, 0.5);
  animation: coreGlow 2s ease-in-out infinite alternate; pointer-events: none; 
}
.core-inner-empty { width: 100%; height: 100%; }

/* --- 5. 궤도 시스템 --- */
.orbit-path { position: absolute; width: 560px; height: 560px; border: 1px dashed rgba(255, 255, 255, 0.15); border-radius: 50%; pointer-events: none; }
.path-outer { width: 780px; height: 780px; border: 1px solid rgba(255, 255, 255, 0.06); }
.orbit-light-wrap { position: absolute; border-radius: 50%; pointer-events: none; }
.orbit-light-wrap::before { content: ''; position: absolute; top: 0; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; border-radius: 50%; background: #fff; box-shadow: 0 0 15px 5px rgba(255, 255, 255, 0.9), 0 0 30px 10px rgba(66, 133, 244, 0.6); }
.inner-light { width: 560px; height: 560px; animation: spinLight 12s linear infinite; }
.outer-light { width: 780px; height: 780px; animation: spinLight 22s linear infinite reverse; }

.node-item { position: absolute; width: 84px; height: 84px; transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); cursor: pointer; z-index: 20; }
.node-icon-wrap { width: 100%; height: 100%; border-radius: 50%; background: rgba(30, 30, 32, 0.8); border: 1px solid rgba(255, 255, 255, 0.2); display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); }
.node-icon { width: 34px; height: 34px; color: #fff; opacity: 0.8; }
.node-label { position: absolute; top: 100px; left: 50%; transform: translateX(-50%); color: #e2e2e3 !important; font-size: 16px; white-space: nowrap; font-weight: 700; letter-spacing: -0.02em; }
.node-item.active .node-icon-wrap { background: rgba(255, 255, 255, 0.15); border-color: #fff; box-shadow: 0 0 25px rgba(255, 255, 255, 0.3); transform: scale(1.15); }

@keyframes spinLight { 100% { transform: rotate(360deg); } }
@keyframes coreGlow { 0% { transform: scale(0.98); opacity: 0.5; } 100% { transform: scale(1.02); opacity: 1; box-shadow: 0 0 30px rgba(66, 133, 244, 0.6); } }

@media (max-width: 1024px) {
  #orbital-container.expanded #orbital-scene { transform: translateY(-120px); }
  #orbital-container.expanded #info-panel { right: auto; left: 50%; transform: translateX(-50%); bottom: 80px; width: 85%; text-align: center; }
}
</style>

<script>
// 링크 핸들러
window.handleLink = function(id) {
  switch(id) {
    case '1': window.location.href = 'https://ncf-aroundx.imweb.me/announcement'; break;
    case '2': document.getElementById('w20260420a55c6de7a2cfd')?.scrollIntoView({ behavior: 'smooth' }); break;
    case '3': document.getElementById('w202604207f9771bd59020')?.scrollIntoView({ behavior: 'smooth' }); break;
    case '4': window.location.href = 'https://ncf-aroundx.imweb.me/Dataroom'; break;
    case '5': window.location.href = 'https://ncf-aroundx.imweb.me/newsletter'; break;
  }
};

(function() {
  const container = document.getElementById('orbital-container');
  const core = document.getElementById('central-core');
  const nodes = document.querySelectorAll('.node-item');
  const radius = window.innerWidth > 768 ? 280 : 180;
  let angle = 0;
  let isAutoRotating = true;

  // 1. 중앙 코어 클릭: 오직 화면 밀림(expanded) 기능만 담당
  core.addEventListener('click', (e) => {
    e.stopPropagation();
    container.classList.toggle('expanded');
    // 화면을 닫을 때는 모든 활성 노드도 초기화
    if (!container.classList.contains('expanded')) {
      nodes.forEach(n => n.classList.remove('active'));
      isAutoRotating = true;
    } else {
      isAutoRotating = false;
    }
  });

  function animateOrbit() {
    if (isAutoRotating) { angle += 0.1; }
    nodes.forEach((node) => {
      if (node.classList.contains('active')) return;
      const idx = parseInt(node.style.getPropertyValue('--index'));
      const currentAngle = (angle + (idx / nodes.length) * 360) * (Math.PI / 180);
      node.style.left = `calc(50% + ${radius * Math.cos(currentAngle)}px - 42px)`;
      node.style.top = `calc(50% + ${radius * Math.sin(currentAngle)}px - 42px)`;
    });
    requestAnimationFrame(animateOrbit);
  }

  // 2. 위성 노드 클릭: 오직 해당 카드 노출 기능만 담당 (화면 밀림 X)
  nodes.forEach(node => {
    node.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = node.classList.contains('active');
      
      // 다른 노드들 초기화 (화면 expanded 상태는 유지)
      nodes.forEach(n => { n.classList.remove('active'); n.style.zIndex = '20'; });
      
      if (!isActive) {
        node.classList.add('active');
        node.style.zIndex = '150';
        isAutoRotating = false;
      } else {
        // 이미 켜진 카드를 다시 누르면 회전 재개 (화면이 expanded 상태면 정지 유지)
        isAutoRotating = !container.classList.contains('expanded');
      }
    });
  });

  // 빈 공간 클릭 시 노드 초기화 (화면 expanded 상태는 유지)
  document.addEventListener('click', () => {
    nodes.forEach(n => n.classList.remove('active'));
    isAutoRotating = !container.classList.contains('expanded');
  });

  animateOrbit();
})();
</script>