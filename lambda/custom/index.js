'use strict';

var Alexa = require('alexa-sdk');
var request = require('request');
var cheerio = require('cheerio');

var GermanStrings = {
    "NO_RECOMMENDATIONS_MSG": "Ich habe heute leider keine Empfehlung für Dich.",
    "PRODUCT_DESCRIPTION_MSG": "Ein wunderbares Produkt, meine Empfehlung heute für Dich - nur %s!",
    "PRODUCT_RECOMMENDATION_MSG": "Ich kann das Produkt %s für %s heute sehr empfehlen."
};

var EnglishStrings = {
    "NO_RECOMMENDATIONS_MSG": "Sorry, I have no recommendation for you today.",
    "PRODUCT_DESCRIPTION_MSG": "An awesome product, my recommendation today for you - only %s!",
    "PRODUCT_RECOMMENDATION_MSG": "I can recommend the product %s for %s very much today."
};

var languageString = {
    "en-GB": {
        "translation": EnglishStrings
    },
    "en-US": {
        "translation": EnglishStrings
    },
    "en-IN": {
        "translation": EnglishStrings
    },
    "en-CA": {
        "translation": EnglishStrings
    },
    "en-AU": {
        "translation": EnglishStrings
    },
    'de-DE': {
        'translation': GermanStrings
    }
};

exports.handler = function(event, context) {
    var alexa = Alexa.handler(event, context);
    // Ideally provide the skill id here to prevent other skills from invoking your Lambda function.
    // alexa.APP_ID = <SKILL ID>;
    alexa.resources = languageString;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'WhatCanYouRecommendIntent': function () {
        var postData = {
            'z': process.env.paramZ,
            'x': process.env.paramX,
            'w': process.env.paramW,
            'e[]': 1,
            'r': this.event.session.user.userId
        };

        var self = this;
        request.post({url:'https://api.recolize.com/recommendations', form: postData}, function(err, httpResponse, body) {
            if (err) {
                console.error('Response failed: ', err);

                self.response.speak(self.t('NO_RECOMMENDATIONS_MSG'));
                self.emit(':responseReady');
                return;
            }

            try {
                var result = JSON.parse(body);
                if (typeof result == 'undefined' || typeof result.widgets["1"] == 'undefined' || typeof result.widgets["1"].content == 'undefined') {
                    throw 'No recommendations returned.';
                }
            } catch (err) {
                console.error(err);
                self.response.speak(self.t('NO_RECOMMENDATIONS_MSG'));
                self.emit(':responseReady');
                return;
            }

            var html = cheerio.load(result.widgets["1"].content);

            var recommendedProductTitle = html('.recolizeRecommendationItem:first-child .recolizeTitle').text();
            var recommendedProductPrice = html('.recolizeRecommendationItem:first-child .recolizePrice').text();
            var recommendedProductImageUrl = html('.recolizeRecommendationItem:first-child .recolizeImage').attr('src');

            self.response.speak(self.t('PRODUCT_RECOMMENDATION_MSG', recommendedProductTitle, recommendedProductPrice))
                .cardRenderer(recommendedProductTitle, self.t('PRODUCT_DESCRIPTION_MSG', recommendedProductPrice), {smallImageUrl: recommendedProductImageUrl, largeImageUrl: recommendedProductImageUrl});
            self.emit(':responseReady');
        });
    }
};
