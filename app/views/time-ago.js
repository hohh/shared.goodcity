import Ember from 'ember';

export default Ember.View.extend({
  templateName: 'time-ago',
  classNames: 'time-ago',
  timeValue: new Date(),

  didInsertElement: function() {

    if(this.smallPrefix) {
      Ember.$.timeago.settings.strings.suffixAgo = "";
      Ember.$.timeago.settings.strings.suffixFromNow = "";
      Ember.$.timeago.settings.strings.seconds = this.locale("1m");
      Ember.$.timeago.settings.strings.minute = this.locale("1m");
      Ember.$.timeago.settings.strings.minutes = "%d" + this.locale("m");
      Ember.$.timeago.settings.strings.hour = this.locale("1h");
      Ember.$.timeago.settings.strings.hours = "%d" + this.locale("h");
      Ember.$.timeago.settings.strings.day = this.locale("1d");
      Ember.$.timeago.settings.strings.days = "%d" + this.locale("d");
      Ember.$.timeago.settings.strings.month = this.locale("1mths");
      Ember.$.timeago.settings.strings.months = "%d" + this.locale("mths");
      Ember.$.timeago.settings.strings.year = this.locale("1y");
      Ember.$.timeago.settings.strings.years = "%d" + this.locale("y");
    }

    Ember.$().ready(function (){
      Ember.$('time.timeago').timeago();
      // update every minute
      setInterval((function() {
        return Ember.$("time.timeago").timeago();
      }), 60000);
    });
  },

  locale: function(str) {
    return Ember.I18n.t("time_ago." + str);
  },

  timeString: function() {
    var timeValue = this.timeValue || new Date();
    return new Date(timeValue).toISOString();
  }.property()
});
