import Ember from 'ember';
import DS from 'ember-data';

var attr = DS.attr,
    belongsTo = DS.belongsTo;

export default DS.Model.extend({
  event:          attr('string'),
  itemType:       attr('string'),
  itemId:         attr('number'),
  whodunnit:      attr('string'),
  whodunnitName:  attr('string'),
  state:          attr('string'),
  createdAt:      attr('date'),

  createdDate: function() {
    return this.get("createdAt").toDateString();
  }.property(),

  displayMessage: function() {
    switch (this.get("state")) {
      case 'draft': return Ember.I18n.t("item_log.added", {name: {name: this.get("whodunnitName")}});
      case 'submitted' : return Ember.I18n.t("item_log.submitted", {name: this.get("whodunnitName")});
      case 'accepted' : return Ember.I18n.t("item_log.accepted", {name: this.get("whodunnitName")});
      case 'rejected' : return Ember.I18n.t("item_log.rejected", {name: this.get("whodunnitName")});
      case 'received' : return Ember.I18n.t("item_log.received", {name: this.get("whodunnitName")});
      case 'missing' : return Ember.I18n.t("item_log.missing", {name: this.get("whodunnitName")});
    }

    switch (this.get("event")) {
      case 'donor_called': return Ember.I18n.t("offer_log.donor_called", {name: this.get("whodunnitName")});
      case 'call_accepted' : return Ember.I18n.t("offer_log.call_accepted", {name: this.get("whodunnitName")});
    }

    return "";
  }.property()
});
