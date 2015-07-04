import Ember from "ember";
import AjaxPromise from './../utils/ajax-promise';

export default Ember.ArrayController.extend({
  sortProperties: ["date"],
  sortAscending: true,
  messagesUtil: Ember.inject.service("messages"),

  nextNotification: function() {
    //retrieveNotification is not implemented here because it needs to call itself
    return this.retrieveNotification();
  }.property("[]"),

  retrieveNotification: function(index) {
    // not sure why but model.firstObject is undefined when there's one notification
    var notification = this.get("model")[index || 0];
    if (!notification) {
      return null;
    }

    this.setRoute(notification);

    // if current url matches notification view action url then dismiss notification
    var router = this.get("target");
    var currentUrl = router.get("url");
    var actionUrl = router.generate.apply(router, notification.route);

    if (currentUrl === actionUrl) {
      this.removeObject(notification);
      return this.retrieveNotification(index);
    }

    return notification;
  },

  itemImageUrl: function() {
    var itemId = this.get("nextNotification.item_id");
    return itemId ? this.store.getById("item", itemId).get("displayImageUrl") : null;
  }.property("nextNotification"),

  showItemImage: Ember.computed.notEmpty("itemImageUrl"),

  senderImageUrl: function() {
    var notification = this.get("nextNotification");
    if (!notification) { return null; }
    return this.store.getById("user", notification.author_id).get("displayImageUrl");
  }.property("nextNotification"),

  setRoute: function(notification) {
    switch (notification.category) {
      case "message":
        notification.route = this.get("messagesUtil").getRoute(notification);
        break;

      case "new_offer":
      case "incoming_call":
        var routeName = this.get("session.isDonorApp") ? "offer" : "review_offer";
        notification.route = [routeName, notification.offer_id];
        break;

      case "call_answered":
        notification.route = ["offer.donor_messages", notification.offer_id];
        break;
    }
  },

  acceptCall: function(notification) {
    var mobile = this.get("session.currentUser.mobile");
    var prefix = mobile.indexOf("+852") === -1 ? "+852" : "";
    var donorId = notification.author_id;
    new AjaxPromise("/twilio/accept_call", "GET", this.get('session.authToken'), { mobile: prefix + mobile, donor_id: donorId })
  },

  actions: {
    view: function() {
      var notification = this.get("nextNotification");
      this.removeObject(notification);
      if (notification.category === "incoming_call") {
        this.acceptCall(notification);
      }
      this.transitionToRoute.apply(this, notification.route);
    }
  }
});
