import Nav from './Nav';
import Footer from './Footer';

// โครงหน้ามาตรฐาน: dock ด้านบน + เนื้อหา + footer
export default function Page({ children, wide }) {
  return (
    <div className={'wrap' + (wide ? ' wide' : '')}>
      <Nav />
      <main className="main view">{children}</main>
      <Footer />
    </div>
  );
}
