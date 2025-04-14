// CustomToolbar.js
import React from "react";
import { FaSave } from "react-icons/fa";

const CustomToolbar = ({ handleSave }) => (
  <div id="toolbar">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <span className="ql-formats">
          <select className="ql-font">
            <option value="sans-serif" selected>
              Sans Serif
            </option>
            <option value="serif">Serif</option>
            <option value="monospace">Monospace</option>
          </select>
          <select className="ql-size">
            <option value="small"></option>
            <option value="normal" selected></option>
            <option value="large"></option>
            <option value="huge"></option>
          </select>
          <button className="ql-bold" />
          <button className="ql-italic" />
          <button className="ql-underline" />
          <button className="ql-strike" />
          <select className="ql-color" />
          <select className="ql-background" />
          <button className="ql-blockquote" />
          <button className="ql-code-block" />
          <button className="ql-list" value="ordered" />
          <button className="ql-list" value="bullet" />
          <button className="ql-indent" value="-1" />
          <button className="ql-indent" value="+1" />
          <button className="ql-align" />
          <button className="ql-link" />
          <button className="ql-image" />
          <button className="ql-video" />
          <button className="ql-clean" />
        </span>
        <span className="flex items-center space-x-4 ml-4">
          <span className="text-lg font-semibold">
            <img src="/Images/logo_genwrite.svg" alt="Lgo" className="border border-black h-4 w-12" />
          </span>
        </span>
      </div>
      <div className="flex items-center space-x-4">
        <button
          className="flex items-center px-4 py-2 bg-blue-500 rounded-md"
          onClick={handleSave}
        >
          <FaSave className="mr-2" />
        </button>
      </div>
    </div>
  </div>
);

export default CustomToolbar;
