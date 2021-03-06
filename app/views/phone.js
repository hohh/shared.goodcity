import Ember from "ember";

export default Ember.View.extend({
  tagName: "span",
  number: null,
  hidden: Ember.computed.empty("number"),
  templateName: "phone",

  displayNumber: function() {
    if (this.get("hidden")) {return ""};
    var num = this.get("number").replace(/\+852/, "");
    return num.length > 4 ? num.substr(0, 4) + " " + num.substr(4) : num;
  }.property("number"),

  linkNumber: function() {
    if (this.get("hidden")) {return ""};
    var prefix = this.get("number").indexOf("+852") === -1 ? "+852" : "";
    return prefix + this.get("number").replace(/ /g, "");
  }.property("number")
});
