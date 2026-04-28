# Global X Pass - Business Requirements

This document outlines the core functional requirements for the Global X Pass platform. These specifications should guide the implementation of features and access control.

## 1. 사업비 자료실 (Expense Resource Center)
*   **Security Level:** High (Confidential)
*   **Access Control:** Managed via `[멤버 그룹 관리]` (Member Group Management).
*   **Implementation:** Configure as a `비밀 게시판` (Secret Board).
*   **Target Audience:** Only accessible to designated representatives of program-participating companies.

## 2. 1:1 컨설팅 지원 (On-demand Office Hour)
Core automation segment for matching 20 participating companies with experts.
*   **System Type:** Utilize `[예약 관리]` (Reservation Management) or `[입력폼]` (Input Form) features.
*   **Section Categories:**
    1.  **법률/특허/회계 (Legal/IP/Accounting):** Profile placement for partners such as 법무법인 비트 and 혜성 어드바이저리.
    2.  **글로벌 진출 (Global Expansion):** Exposure of coaching slots for local partners (e.g., VTC Online) and local staff.
    3.  **기술 자문 (Tech Consultation):** Application menu for online meetups with Google Play TAs.
*   **Workflow:** Select preferred time → Submit application (Describe issues/needs) → Operator (Host) approval/confirmation → Automated notification via Alimtalk/Email.

## 3. Founder’s Club (Peer Learning)
Community-focused section with emphasis on First-Come-First-Served (FCFS) matching.
*   **Board Configuration:** Combine `[글쓰기 권한 제어]` (Write Permission Control) with `[댓글/신청]` (Comment/Application) functionality.
*   **Operation:** Upload recruitment posts weekly or bi-weekly for specific themes (e.g., 'SaaS MRR Growth', 'Vietnam Marketing').
*   **FCFS Management:** Limit groups to 5–7 participants. Use the `예약` (Reservation) feature or manually toggle `[상태값(모집중/마감)]` (Status: Recruiting/Closed).
*   **Schedule Visibility:** Integrate a `[캘린더 위젯]` (Calendar Widget) on the main screen to display club schedules at a glance.

## 4. Market & Tech Insight (Media & Report)
Rich media section focusing on visual and audio content.
*   **VOD/Podcast:**
    *   YouTube integration or video widgets for series: Market (ASEAN), Tech (Gen AI), and VC Trends.
    *   Podcasts via audio embedding or external links (Podbbang, Spotify).
*   **Weekly Report:**
    *   Operated as a `[자료실 게시판]` (Archive/Resource Board).
    *   Features: Sort by 'Latest', enhanced `태그 검색` (Tag Search) for easy access to historical reports.
