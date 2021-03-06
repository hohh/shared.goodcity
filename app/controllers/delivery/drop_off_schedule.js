import Ember from 'ember';
import AjaxPromise from './../../utils/ajax-promise';

export default Ember.Controller.extend({
  needs: ["delivery", "offer"],

  datePrompt: Ember.I18n.t("gogovan.book_van.date"),
  timePrompt: Ember.I18n.t("gogovan.book_van.time"),

  slots: function() {
    return this.store.all('timeslot').sortBy('id');
  }.property('timeslot.@each'),

  selectedId: function(){
    return this.get('slots.firstObject.id');
  }.property('slots'),

  selectedDate: null,

  available_dates: function(key, value){
    if (arguments.length > 1) {
      return value;
    } else {
      new AjaxPromise("/available_dates", "GET", this.get('session.authToken'), {schedule_days: 40})
        .then(data => this.set("available_dates", data));
      return value;
    }
  }.property('available_dates.[]'),

  actions: {
    bookSchedule: function() {
      var controller   = this;
      var loadingView  = this.container.lookup('view:loading').append();
      var selectedSlot = controller.get('selectedId');
      var slotName     = controller.get('slots').filterBy('id', selectedSlot.get('id')).get('firstObject.name');

      var scheduleProperties = {
        slot:        selectedSlot.id,
        scheduledAt: controller.get('selectedDate'),
        slotName:    slotName };

      var deliveryId = this.get('controllers.delivery.model.id');
      var delivery   = this.store.getById('delivery', deliveryId);
      var offer      = delivery.get("offer");
      var deliveryType = delivery.get("deliveryType");

      var properties = {
        delivery: {
          id: deliveryId,
          deliveryType: deliveryType,
          offerId: offer.id,
          scheduleAttributes: scheduleProperties }
      };

      new AjaxPromise("/confirm_delivery", "POST", this.get('session.authToken'), properties)
        .then(function(data) {
          controller.store.pushPayload(data);
          controller.set("inProgress", false);
          offer.set('state', 'scheduled');
          loadingView.destroy();
          if(controller.get("session.isAdminApp")) {
            controller.transitionToRoute('review_offer.logistics', offer);
          } else {
            controller.transitionToRoute('offer.transport_details', offer);
          }
        }).catch(error => {
          loadingView.destroy();
          throw error;
      });
    }
  }
});
