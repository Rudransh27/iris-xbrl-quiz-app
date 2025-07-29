import React from "react";
import "./MapTicket.css";

export default function MapTicket({ topic, status, order }) {
  return (
    <div className={`map-ticket-small ${status}`}>
      <div className="map-ticket-small__imgWrap">
        <img src={topic.image} alt={topic.title} className="map-ticket-small__img" />
      </div>
      <div className="map-ticket-small__body">
        <h4 className="map-ticket-small__heading">{order}. {topic.title}</h4>
        <p className="map-ticket-small__summary">{topic.summary}</p>
      </div>
    </div>
  );
}
