import Ember from "ember";

export default Ember.Service.extend({
  logger: Ember.inject.service(),
  session: Ember.inject.service(),

  markRead: function(message) {
    var adapter = this.container.lookup("adapter:application");
    var url = adapter.buildURL("message", message.id) + "/mark_read";
    adapter.ajax(url, "PUT")
      .then(data => message.setProperties(data.message))
      .catch(error => this.get("logger").error(error));
  },

  getRoute: function( message) {
    var isDonorApp = this.get("session.isDonorApp");
    var offerId = message.get ? message.get("offer.id") : message.offer_id;
    var itemId = message.get ? message.get("item.id") : message.item_id;
    var isPrivate = message.get ? message.get("isPrivate") : message.is_private;
    isPrivate = isPrivate ? isPrivate.toString().toLowerCase() === "true" : false;

    if (isDonorApp) {
      if (itemId) {
        return ["item.messages", offerId, itemId];
      } else {
        return ["offer.messages", offerId];
      }
    } else if (isPrivate) {
      if (itemId) {
        return ["review_item.supervisor_messages", offerId, itemId];
      } else {
        return ["offer.supervisor_messages", offerId];
      }
    } else {
      if (itemId) {
        return ["review_item.donor_messages", offerId, itemId];
      } else {
        return ["offer.donor_messages", offerId];
      }
    }
  }
});
