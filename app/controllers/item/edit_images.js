import Ember from "ember";

export default Ember.Controller.extend({
  needs: ["offer"],
  offer: Ember.computed.alias("controllers.offer.model"),
  item: Ember.computed.alias("model"),

  session: Ember.inject.service(),
  store: Ember.inject.service(),
  alert: Ember.inject.service(),
  customConfirm: Ember.inject.service(),
  confirm: Ember.inject.service(),
  offerId: null,
  itemId: null,
  packageId: null,
  noImage: Ember.computed.empty("item.images"),
  previewImage: null,
  addPhotoLabel: Ember.I18n.t("edit_images.add_photo"),
  isReady: false,
  isExpanded: false,
  backBtnVisible: true,
  loadingPercentage: Ember.I18n.t("edit_images.image_uploading"),
  uploadedFileDate: null,

  package: function() {
    return this.get("store").getById("package", this.get("packageId"));
  }.property("packageId"),

  previewMatchesFavourite: function() {
    return this.get("previewImage") === this.get("favouriteImage");
  }.property("previewImage", "favouriteImage"),

  images: function() {
    //The reason for sorting is because by default it's ordered by favourite
    //then id order. If another image is made favourite then deleted the first image
    //by id order is made favourite which can be second image in list which seems random.

    //Sort by id ascending except place new images id = 0 at end
    return (this.get("item.images") || Ember.A()).toArray().sort(function(a,b) {
      a = parseInt(a.get("id"));
      b = parseInt(b.get("id"));
      if (a === 0) { return 1; }
      if (b === 0) { return -1; }
      return a - b;
    });
  }.property("item.images.[]"),

  favouriteImage: function() {
    return this.get("package") ?
      this.get("package.image") :
      this.get("images").filterBy("favourite").get("firstObject");
  }.property("item.images.@each.favourite", "package.image"),

  initPreviewImage: function() {
    var image = this.get("package.image") || this.get("item.displayImage");
    if (image) {
      this.send("setPreview", image);
    }
  }.observes("package", "item", "item.images.@each").on("init"),

  //css related
  previewImageBgCss: function() {
    var css = this.get("instructionBoxCss");
    if (!this.get("previewImage")) {
      return css;
    }
    return css + "background-image:url(" + this.get("previewImage.imageUrl") + ");" +
      "background-size: " + (this.get("isExpanded") ? "contain" : "cover") + ";";
  }.property("previewImage", "isExpanded"),

  instructionBoxCss: function() {
    var height = Ember.$(window).height() * 0.6;
    return "min-height:" + height + "px;";
  }.property("previewImage", "isExpanded"),

  thumbImageCss: function() {
    var imgWidth = Math.min(120, Ember.$(window).width() / 4 - 14);
    return "width:" + imgWidth + "px; height:" + imgWidth + "px;";
  }.property(),

  noImageLink: function() {
    return this.get("noImage") && this.get("session.isAdminApp");
  }.property("noImage"),

  locale: function(str){
    return Ember.I18n.t(str);
  },

  createItem: function(donorCondition, withoutImage, identifier) {
    var _this = this;
    var loadingView = this.container.lookup('view:loading').append();
    var offer = this.get("offer");
    var item = this.get("store").createRecord("item", {
      offer: offer,
      donorCondition: donorCondition,
      state: "draft"
    });
    item.save()
      .then(() => {
        if(withoutImage) {
          loadingView.destroy();
          _this.transitionToRoute("review_item.accept", _this.get('offer'), item);
        }
        else
        {
          this.get("store").createRecord('image', {cloudinaryId: identifier, item: item, favourite: true}).save()
            .then(function() {
              _this.send("newItem", item)
              loadingView.destroy();
            });
        }
      })
      .catch(error => {
        item.unloadRecord();
        loadingView.destroy();
        throw error;
      });
  },

  deleteOffer: function(loadingView) {
    var controller = this;
    var offer = this.get("offer");
    offer.destroyRecord().then(function(){
      controller.transitionToRoute('my_list.reviewing');
    })
    .finally(() => loadingView.destroy());
  },

  cancelItem: function(controller, item) {
    var offer = item.get('offer');
    var loadingView = controller.container.lookup('view:loading').append();

    if(offer.get('itemCount') === 1){
      var delivery = offer.get("delivery");
      if(delivery)
        this.get("confirm").show(this.locale("edit_images.cancelling_item_will_cancel_offer"),
          () =>{
            var gogovanOrder = offer.get("delivery.gogovanOrder");
            if(gogovanOrder && gogovanOrder.get("isActive")){
              loadingView.destroy();
              controller.transitionToRoute("offer.cancel_gogovan", offer)
            }
            else
              this.deleteOffer(loadingView);
          }
        );
      else
        this.deleteOffer(loadingView);
    }
    else{
      offer.get('items').removeObject(item);
      item.destroyRecord().then(function(){
        controller.transitionToRoute("review_offer.items");
      })
      .finally(() => loadingView.destroy());
    }
  },

  removeImage: function(controller, item) {
    var _this = this;
    var img = item.get("images.firstObject");
    var loadingView = controller.container.lookup('view:loading').append();
    img.deleteRecord();
    img.save()
      .then(i => {
        i.unloadRecord();
        controller.transitionToRoute("item.edit_images", item);
      })
    .finally(() => loadingView.destroy());
  },

  confirmRemoveLastImage: function() {
    var item = this.get("item");
    this.get("customConfirm").show(this.locale("edit_images.last_image_with_item"),
      this.locale("edit_images.remove_image"), this.locale("edit_images.cancel_item"),
      () => this.cancelItem(this, item),
      () => this.removeImage(this, item)
    );
  },

  cannotRemoveImageAlert: function(){
    this.get("alert").show(this.locale("edit_images.cant_delete_last_image"));
  },

  actions: {
    next: function() {
      if(this.get("session.isAdminApp")) {
        this.transitionToRoute("review_item.accept", this.get('offer'), this.get('model'));
      } else {
        this.transitionToRoute("item.edit");
      }
    },

    //only used for admin
    nextWithoutImage: function() {
      var item = this.get("item")
      if(item){
        this.transitionToRoute("review_item.accept", this.get('offer'), item);
      }
      else{
        var defaultDonorCondition = this.get("store").all("donorCondition").sortBy("id").get("firstObject");
        this.createItem(defaultDonorCondition, true);
      }
    },

    back: function() {
      if(this.get("session.isAdminApp")) {
        this.transitionToRoute("review_offer.items");
      } else {
        if (this.get('offer.itemCount') === 0){
          this.transitionToRoute("offers");
        } else {
          this.transitionToRoute("offer.offer_details");
        }
      }
    },

    newItem: function(item) {
      if(this.get("session.isAdminApp")){
        this.transitionToRoute("item.edit_images", item.get("id"));
      } else {
        this.transitionToRoute("item.edit", item.get("id"));
      }
    },

    setPreview: function(image) {
      this.get("item.images").setEach("selected", false);
      image.set("selected", true);
      this.set("previewImage", image);
    },

    setFavourite: function() {
      if (this.get("package")) {
        var pkg = this.get("package");
        pkg.set("imageId", this.get("previewImage.id"));
        pkg.save()
          .catch(error => { pkg.rollback(); throw error; });
      } else {
        this.get("item.images").setEach("favourite", false);
        this.get("previewImage").set("favourite", true).save()
          .catch(error => {
            this.get("item.images").forEach(img => img.rollback());
            throw error;
          });
      }
    },

    deleteImage: function() {
      if (this.get("item.images.length") === 1)
      {
        this.get("session.isAdminApp") ? this.confirmRemoveLastImage()
          : this.cannotRemoveImageAlert();
        return;
      }
      else {
        this.get("confirm").show(Ember.I18n.t("edit_images.delete_confirm"), () => {
          var loadingView = this.container.lookup('view:loading').append();
          var img = this.get("previewImage");
          img.deleteRecord();
          img.save()
            .then(i => {
              i.unloadRecord();
              this.initPreviewImage();
              if (!this.get("favouriteImage")) {
                this.send("setFavourite");
              }
            })
            .catch(error => { this.get("previewImage").rollback(); throw error; })
            .finally(() => loadingView.destroy());
        });
      }
    },

    expandImage: function() {
      var value = this.get("isExpanded");
      this.set("isExpanded", !value);
    },

    //file upload
    triggerUpload: function() {
      if(navigator.userAgent.match(/iemobile/i))
      {
        //don't know why but on windows phone need to click twice in quick succession
        //for dialog to appear
        Ember.$("#photo-list input[type='file']").click().click();
      }
      else
      {
        Ember.$("#photo-list input[type='file']").trigger("click");
      }
    },

    uploadReady: function() {
      this.set("isReady", true);
    },

    uploadStart: function(e, data) {
      this.set("uploadedFileDate", data);
      Ember.$(".loading-image-indicator").show();
    },

    cancelUpload: function(){
      if(this.get("uploadedFileDate")){ this.get("uploadedFileDate").abort(); }
    },

    uploadProgress: function(e, data) {
      var progress = parseInt(data.loaded / data.total * 100, 10) || 0;
      this.set("addPhotoLabel", progress + "%");
      this.set("loadingPercentage", Ember.I18n.t("edit_images.image_uploading") + progress + "%");
    },

    uploadComplete: function() {
      this.set("uploadedFileDate", null);
      Ember.$(".loading-image-indicator.hide_image_loading").hide();
      this.set("addPhotoLabel", Ember.I18n.t("edit_images.add_photo"));
      this.set("loadingPercentage", Ember.I18n.t("edit_images.image_uploading"));
    },

    uploadSuccess: function(e, data) {
      var identifier = data.result.version + "/" + data.result.public_id + "." + data.result.format;
      var item = this.get("item");
      if (!item || this.get("item.isOffer")) {
        var defaultDonorCondition = this.get("store").all("donorCondition").sortBy("id").get("firstObject");
        this.createItem(defaultDonorCondition, false, identifier)
      } else {
        var favourite = item.get("images.length") === 0;
        var img = this.get("store").createRecord('image', {cloudinaryId: identifier, item: this.get("item"), favourite: favourite});
        img.save().catch(error => { img.unloadRecord(); throw error; });
      }
    }
  },

});
