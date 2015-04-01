import Ember from 'ember';
import DS from 'ember-data';

var attr = DS.attr,
    hasMany = DS.hasMany,
    belongsTo = DS.belongsTo;

export default DS.Model.extend({
  language:       attr('string'),
  state:          attr('string', {defaultValue: 'draft'}),
  origin:         attr('string'),
  stairs:         attr('boolean'),
  parking:        attr('boolean'),
  estimatedSize:  attr('string'),
  notes:          attr('string'),
  createdAt:      attr('date'),
  updatedAt:      attr('date'),
  submittedAt:    attr('date'),
  state_event:    attr('string'),
  reviewedAt:     attr('date'),
  receivedAt:     attr('date'),
  reviewCompletedAt: attr('date'),

  gogovanTransport:    belongsTo('gogovan_transport'),
  crossroadsTransport: belongsTo('crossroads_transport'),

  // used for items of current-offer
  saleable:       attr('boolean'),

  items:          hasMany('item'),
  messages:       hasMany('message'),

  delivery:       belongsTo('delivery'),
  createdBy:      belongsTo('user'),
  reviewedBy:     belongsTo('user'),

  // User details
  userName:       attr('string'),
  userPhone:      attr('string'),

  crossroadsTruckCost: function(){
    return this.get('crossroadsTransport.cost');
  }.property('crossroadsTransport'),

  offersCount: function() {
    return this.store.all("offer").get("length");
  }.property(''),

  itemCount: function() {
    return this.get("items").rejectBy("state", "draft").length;
  }.property('items.@each.state'),

  approvedItems: Ember.computed.filterBy("items", "state", "accepted"),
  rejectedItems: Ember.computed.filterBy("items", "state", "rejected"),
  submittedItems: Ember.computed.filterBy("items", "state", "submitted"),
  isDraft: Ember.computed.equal("state", "draft"),
  isSubmitted: Ember.computed.equal("state", "submitted"),
  isScheduled: Ember.computed.equal("state", "scheduled"),
  isUnderReview: Ember.computed.equal("state", "under_review"),
  isReviewed: Ember.computed.equal("state", "reviewed"),
  isClosed: Ember.computed.equal("state", "closed"),
  isReceived: Ember.computed.equal("state", "received"),

  // removedAt:      attr('date'),
  // isRemoved: Ember.computed.notEmpty("removedAt"),

  activeItems: function(){
    return this.get('items').rejectBy("state", "draft");
  }.property('items.@each.state'),

  isReviewing: function(){
    return this.get('isUnderReview') || this.get('isReviewed');
  }.property('isUnderReview', 'isReviewed'),

  needReview: function(){
    return this.get('isUnderReview') || this.get('isSubmitted') || this.get("isClosed");
  }.property('isUnderReview', 'isSubmitted', 'isClosed'),

  nonEmptyOffer: function(){
    return this.get('itemCount') > 0;
  }.property('items.@each'),

  allItemsReviewed: function(){
    var reviewedItems = this.get('activeItems').filterBy('state', 'submitted');
    return this.get('needReview') && reviewedItems.get('length') === 0;
  }.property('items.@each.state', 'needReview'),

  allItemsRejected: function(){
    var rejectedItems = this.get('activeItems').filterBy('state', 'rejected');
    return this.get('needReview') && (rejectedItems.get('length') === this.get('itemCount'));
  }.property('items.@each.state', 'needReview'),

  displayImageUrl: function(){
    return this.get("activeItems.firstObject.displayImageUrl") || "assets/images/default_item.jpg";
  }.property('items.@each.displayImageUrl'),

  isCharitableSale: function() {
    return this.get("items").rejectBy("saleable", false).length > 0 ? "Yes" : "No";
  }.property('items.@each.saleable'),

  isAccepted: function() {
    return (this.get("approvedItems").length > 0) && this.get('isReviewed');
  }.property('items.@each.saleable'),

  status: function(){
    var state = this.get('state');
    var status;
    switch(state) {
      case 'draft': return this.locale('offers.index.complete_offer');
      case 'under_review' : return this.locale('offers.index.in_review');
      case 'submitted' : return this.locale('offers.index.awaiting_review');
      case 'reviewed' : return this.locale('offers.index.arrange_transport');
      case 'scheduled' : return this.scheduled_status();
      case 'closed' : return this.locale('offers.index.closed');
      case 'received' : return this.locale('offers.index.received');
    }
    return status;
  }.property('state'),

  locale: function(text) {
    return Ember.I18n.t(text);
  },

  status_text: function(){
    return this.get("isDraft") ? this.get("status") : (this.get("status") + " ("+ this.get("itemCount") + " items)")
  }.property('status'),

  scheduled_status: function(){
    var deliveryType = this.get("delivery.deliveryType")
    switch(deliveryType) {
      case "Gogovan" : return this.get("gogovan_status");
      case "Drop Off" : return this.locale("offers.index.drop_off");
      case "Alternate" : return this.locale("offers.index.alternate");
    }
  },

  gogovan_status: function(){
    if(this.get("delivery.gogovanOrder.isPending")){
      return this.locale("offers.index.van_booked");
    }
    else{
      return this.locale("offers.index.van_confirmed");
    }
  }.property("delivery.gogovanOrder.status"),

  isOffer: function() {
    return this.get('constructor.typeKey') === 'offer';
  }.property('this'),

  // unread offer-items messages
  unreadMessagesCount: function() {
    return this.get('messages').filterBy('state', 'unread').length;
  }.property('messages.@each.state'),

  hasUnreadMessages: function() {
    return this.get('unreadMessagesCount') > 0;
  }.property('unreadMessagesCount'),

  // unread offer-messages
  unreadOfferMessages: function(){
    return this.get('messages').filterBy('state', 'unread').filterBy('item', null).sortBy('createdAt');
  }.property('messages.@each.state'),

  unreadOfferMessagesCount: function(){
    var count = this.get('unreadOfferMessages.length');
    return count > 0 ? count : '';
  }.property('unreadOfferMessages'),

  // unread offer-messages by donor
  hasUnreadDonorMessages: function(){
    return this.get('unreadOfferMessages').filterBy('isPrivate', false).length > 0;
  }.property('unreadOfferMessages'),

  // unread offer-messages by supervisor-reviewer
  hasUnreadPrivateMessages: function(){
    return this.get('unreadOfferMessages').filterBy('isPrivate', true).length > 0;
  }.property('unreadOfferMessages'),

  // recent offer message
  lastMessage: function() {
    var messages = this.get('messages').filterBy('item', null).sortBy('createdAt');
    return messages.get('length') > 0 ? messages.get('lastObject') : null;
  }.property('messages.[]'),

  hasCrossroadsTransport: function(){
    return this.get('crossroadsTransport') && this.get('crossroadsTransport.name') !== Ember.I18n.t("offer.disable");
  }.property('crossroadsTransport'),

  hasGogovanTransport: function(){
    return this.get('gogovanTransport') && this.get('gogovanTransport.name') !== Ember.I18n.t("offer.disable");
  }.property('gogovanTransport'),

  // display "General Messages Thread"
  displayGeneralMessages: function(){
    return !(this.get('isDraft') && this.get('lastMessage') === null);
  }.property('state', 'lastMessage'),

  // to sort on offer-details page for updated-offer and latest-message
  latestUpdatedTime: function(){
    var value;
    switch(Ember.compare(this.get('lastMessage.createdAt'), this.get('updatedAt'))) {
      case 0 :
      case 1 : value = this.get('lastMessage.createdAt'); break;
      case -1 : value = this.get('updatedAt'); break;
    }
    return value;
  }.property('lastMessage'),

  showOfferIcons:  function(){
    return this.get("itemCount") > 0 && !(this.get('isClosed') || this.get('isReceived'));
  }.property('items.@each.state'),

  preventNewItem:  function(){
    return this.get('isReviewed') || this.get('isScheduled');
  }.property('items.@each.state'),

});
