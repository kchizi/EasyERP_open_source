define([
    'Underscore',
    'jQuery',
    'views/listViewBase',
    'text!templates/Invoices/list/ListHeader.html',
    'text!templates/stages.html',
    'views/Invoices/CreateView',
    'views/Invoices/EditView',
    'models/InvoiceModel',
    'views/Invoices/list/ListItemView',
    'views/Orders/list/ListTotalView',
    'collections/Invoices/filterCollection',
    'views/Filter/filterView',
    'dataService',
    'constants',
    'helpers'
], function (_, $, ListViewBase, listTemplate, stagesTemplate, CreateView, EditView, InvoiceModel, ListItemView, ListTotalView, contentCollection, FilterView, dataService, CONSTANTS, helpers) {
    'use strict';

    var InvoiceListView = ListViewBase.extend({
        CreateView       : CreateView,
        listTemplate     : listTemplate,
        ListItemView     : ListItemView,
        contentCollection: contentCollection,
        contentType      : 'Invoice',

        initialize: function (options) {
            this.startTime = options.startTime;
            this.collection = options.collection;
            this.filter = options.filter || {};
            this.filter.forSales = {
                key  : 'forSales',
                value: ['false']
            };
            this.forSales = false;
            this.sort = options.sort;
            this.defaultItemsNumber = this.collection.namberToShow || 100;
            this.newCollection = options.newCollection;
            this.deleteCounter = 0;
            this.page = options.collection.page;

            this.render();

            this.contentCollection = contentCollection;
        },

        events: {
            'click .stageSelect'           : 'showNewSelect',
            'click  .list td:not(.notForm)': 'goToEditDialog',
            'click .newSelectList li'      : 'chooseOption'
        },

        chooseOption: function (e) {
            var self = this;
            var target$ = $(e.target);
            var targetElement = target$.parents('td');
            var id = targetElement.attr('id');
            var model = this.collection.get(id);

            model.save({
                workflow: target$.attr('id')
            }, {
                headers: {
                    mid: 55
                },

                patch   : true,
                validate: false,
                success : function () {
                    self.showFilteredPage(self.filter, self);
                }
            });

            this.hideNewSelect();
            return false;
        },

        recalcTotal: function () {
            var self = this;
            var columns = ['total', 'unTaxed'];

            _.each(columns, function (col) {
                var sum = 0;

                _.each(self.collection.toJSON(), function (model) {
                    sum += parseFloat(model.paymentInfo[col]);
                });

                self.$el.find('#' + col).text(helpers.currencySplitter(sum.toFixed(2)));
            });
        },

        render: function () {
            var self;
            var $currentEl;
            var itemView;

            $('.ui-dialog ').remove();

            self = this;
            $currentEl = this.$el;
            $currentEl.html('');

            $currentEl.append(_.template(listTemplate, {currentDb: App.weTrack}));
            itemView = new ListItemView({
                collection : self.collection,
                page       : self.page,
                itemsNumber: self.collection.namberToShow
            });

            itemView.bind('incomingStages', this.pushStages, this);

            $currentEl.append(itemView.render());

            $currentEl.append(new ListTotalView({element: this.$el.find('#listTable'), cellSpan: 7}).render());

            this.renderPagination($currentEl, this);
            this.renderFilter({name: 'forSales', value: {key: 'forSales', value: [false]}});

            $currentEl.append('<div id="timeRecivingDataFromServer">Created in ' + (new Date() - this.startTime) + ' ms</div>');
        },

        goToEditDialog: function (e) {
            var self = this;
            var id = $(e.target).closest('tr').data('id');
            var model = new InvoiceModel({validate: false});

            e.preventDefault();

            model.urlRoot = '/Invoices';
            model.fetch({
                data: {
                    id      : id,
                    forSales: self.forSales,
                    viewType: 'form'
                },

                success: function (model) {
                    return new EditView({model: model});
                },

                error: function () {
                    App.render({
                        type   : 'error',
                        message: 'Please refresh browser'
                    });
                }
            });
        }
    });
    return InvoiceListView;
});
