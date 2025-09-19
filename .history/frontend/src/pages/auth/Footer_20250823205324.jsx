// Footer.jsx
import React from "react";
import { FaFacebook, FaInstagram, FaEnvelope, FaPhone } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-5 mt-5">
      <div className="container">
        <div className="row">
          {/* Cột 1: Giới thiệu */}
          <div className="col-md-4 mb-4">
            <h5 className="text-info">Future Tech Store</h5>
            <p>
              Nền tảng thương mại điện tử chuyên bán đồ điện tử mới (B2C) và cũ (C2C).  
              Cam kết mang lại trải nghiệm mua sắm hiện đại, an toàn và minh bạch.
            </p>
          </div>

          {/* Cột 2: Điều khoản */}
          <div className="col-md-4 mb-4">
            <h5 className="text-info">Điều khoản sử dụng</h5>
            <div className="accordion" id="accordionExample">
              <div className="accordion-item bg-dark text-light">
                <h2 className="accordion-header">
                  <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne">
                    Đăng ký & Đăng nhập
                  </button>
                </h2>
                <div id="collapseOne" className="accordion-collapse collapse" data-bs-parent="#accordionExample">
                  <div className="accordion-body">
                    Cung cấp thông tin chính xác khi đăng ký. Dữ liệu được bảo vệ theo chính sách bảo mật.
                  </div>
                </div>
              </div>

              <div className="accordion-item bg-dark text-light">
                <h2 className="accordion-header">
                  <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo">
                    Giao dịch B2C
                  </button>
                </h2>
                <div id="collapseTwo" className="accordion-collapse collapse" data-bs-parent="#accordionExample">
                  <div className="accordion-body">
                    Bán sản phẩm mới với giá niêm yết. Thanh toán: VNPay, MoMo, PayPal. Vận chuyển: GHN, GHTK, Viettel Post.
                  </div>
                </div>
              </div>

              <div className="accordion-item bg-dark text-light">
                <h2 className="accordion-header">
                  <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree">
                    Giao dịch C2C
                  </button>
                </h2>
                <div id="collapseThree" className="accordion-collapse collapse" data-bs-parent="#accordionExample">
                  <div className="accordion-body">
                    Người dùng đăng sản phẩm cũ (6 ảnh, mô tả). Admin duyệt trước khi đăng. Thu phí 2-4%.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cột 3: Liên hệ */}
          <div className="col-md-4 mb-4">
            <h5 className="text-info">Liên hệ</h5>
            <p><FaEnvelope /> support@futuretech.vn</p>
            <p><FaPhone /> 0123 456 789</p>
            <div className="d-flex gap-3 fs-4">
              <a href="#" className="text-light"><FaFacebook /></a>
              <a href="#" className="text-light"><FaInstagram /></a>
            </div>
          </div>
        </div>

        <hr className="border-secondary" />
        <p className="text-center mb-0">© 2025 Future Tech Store. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
