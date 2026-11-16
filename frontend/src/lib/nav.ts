export type NavChild = { label: string; href: string };
export type NavItem = {
  label: string;
  /** Shorter label for the single-row header where space is tight. */
  short?: string;
  href: string;
  children?: NavChild[];
};

export const VAST = "https://vast.gov.vn/";

export const NAV: NavItem[] = [
  {
    label: "Trang chủ",
    href: "/",
    children: [
      { label: "Trang Chủ 1 — tin của Viện + cột báo chí", href: "/" },
      { label: "Trang Chủ 2 — báo chí đầu trang", href: "/?v=2" },
      { label: "Trang Chủ 3 — như Trang Chủ 2, không banner", href: "/?v=3" },
    ],
  },
  {
    label: "Cơ cấu tổ chức",
    href: "/co-cau-to-chuc",
    children: [
      { label: "Lãnh đạo và Quản lý", href: "/co-cau-to-chuc/lanh-dao" },
      { label: "Các đơn vị chức năng", href: "/co-cau-to-chuc/hanh-chinh" },
      { label: "Các đơn vị nghiên cứu", href: "/co-cau-to-chuc/nghien-cuu" },
      { label: "Các đơn vị khác", href: "/co-cau-to-chuc/su-nghiep" },
      { label: "Doanh nghiệp Nhà nước", href: "/co-cau-to-chuc/doanh-nghiep" },
    ],
  },
  {
    label: "Tin tức - Sự kiện",
    short: "Tin tức",
    href: "/tin-tuc",
    children: [
      { label: "Tin tức hoạt động của Viện Hàn lâm", href: "/tin-tuc/hoat-dong" },
      { label: "Tin KH&CN trong nước", href: "/tin-tuc/khcn-trong-nuoc" },
      { label: "Nghiên cứu cơ bản", href: "/tin-tuc/nghien-cuu-co-ban" },
      { label: "Nghiên cứu và Phát triển công nghệ", href: "/tin-tuc/phat-trien-cong-nghe" },
      { label: "Điều tra cơ bản", href: "/tin-tuc/dieu-tra-co-ban" },
      { label: "Tin KH&CN quốc tế", href: "/tin-tuc/khcn-quoc-te" },
      { label: "Tin nóng KHCN (tổng hợp từ báo chí)", href: "/tin-nong-khcn" },
    ],
  },
  { label: "Chương trình KHCN trọng điểm", short: "Chương trình KHCN", href: "/chuong-trinh-khcn-trong-diem" },
  {
    label: "Giải thưởng Trần Đại Nghĩa",
    short: "Giải thưởng",
    href: "/giai-thuong",
    children: [
      { label: "Tin tức Giải thưởng", href: "/giai-thuong/giai-thuong-tin-tuc" },
      { label: "Tiểu sử GS.VS. Trần Đại Nghĩa", href: "/giai-thuong/giai-thuong-tieu-su" },
      { label: "Văn bản - Thủ tục hồ sơ", href: "/giai-thuong/giai-thuong-van-ban" },
      { label: "Thông báo", href: "/giai-thuong/giai-thuong-thong-bao" },
      { label: "Dữ liệu Giải thưởng", href: "/giai-thuong/giai-thuong-du-lieu" },
    ],
  },
  {
    label: "KHCN, ĐMST và CĐS",
    short: "KHCN - ĐMST - CĐS",
    href: "/chuyen-doi-so",
    children: [
      { label: "Bản tin phát triển KH&CN, ĐMST & CĐS", href: "/chuyen-doi-so/cds-ban-tin" },
      { label: "Việt Nam phát triển KH&CN, ĐMST & CĐS", href: "/chuyen-doi-so/cds-viet-nam" },
      { label: "Cải cách hành chính", href: "/chuyen-doi-so/cds-cai-cach-hanh-chinh" },
      { label: "Ứng dụng CNTT", href: "/chuyen-doi-so/cds-ung-dung-cntt" },
      { label: "IPv6", href: "/chuyen-doi-so/cds-ipv6" },
    ],
  },
  {
    label: "Hoạt động đào tạo",
    short: "Đào tạo",
    href: "/hoat-dong-dao-tao",
    children: [
      { label: "Thông tin đào tạo", href: "/hoat-dong-dao-tao/dao-tao" },
      { label: "Thông tin tuyển sinh", href: "/hoat-dong-dao-tao/tuyen-sinh" },
    ],
  },
];
