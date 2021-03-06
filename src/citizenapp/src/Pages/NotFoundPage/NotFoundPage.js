import React from "react";
import { Link } from "react-router-dom";
import PageNotFound from "../../Images/medErrorImage.jpg";
import "./NotFoundPage.css";

/*
 * Simple 404 page.
 */

class NotFoundPage extends React.Component {
  render() {
    return (
      <div className="text">
        <h2>404 - Siden finnes ikke </h2>
        <div className="head-error-image">
          <img src={PageNotFound} className="error-image" alt="pageNotFound" />
        </div>
        <p>
          Oi! Siden du ser etter finnes ikke. <br />
          <Link to="/"> Gå til startsiden </Link>
        </p>
      </div>
    );
  }
}
export default NotFoundPage;
