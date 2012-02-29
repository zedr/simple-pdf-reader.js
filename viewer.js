//Incremental PDF viewer for Pdf.js
//Author: Rigel Di Scala <zedr@zedr.com>


function PdfViewer(url) {
    "use strict";

    // Setup the canvas
    var canvas, context, frame_id = 'pdf-viewer', frame = document.getElementById(frame_id);

    // Setup the page
    // The "head" is the last page we rendered in a canvas
    var pnum = 0;
    var pscale = 1.0;

    var self = this;

    // Load the pdf document file
    PDFJS.getPdf (url, function getPdfData(data) {
        self.doc = new PDFJS.PDFDoc(data);
        self.last = self.doc.numPages;
        createNextFrame();
        load();
        pnum++;
        return render();
    });

    // Creates a new canvas, where we can render the next page of the pdf
    var createNextFrame = function () {
        var elem = document.createElement('canvas');
        frame.appendChild(elem);
    };

    // Get a handle on the last canvas we rendered; this is our "head"
    var load = function (val) {
        canvas = (val === undefined) ? frame.lastChild : frame.children[val];
        return val || pnum;
    };

    // Render the page in the canvas
    //
    // @param val : the number of the page we wish to render
    var render = function (val) {

        // Either render the specified page, or render the "head"
        var page = self.doc.getPage((val)? val : pnum);

        context = canvas.getContext('2d');

        // Resize the canvas accordingly
        canvas.height = page.height * pscale;
        canvas.width = page.width * pscale;

        // Now render
        page.startRendering(context);
    };

    // Re-render all the pages. This is called when we change the scale.
    this.reload = function () {
        // Iterate through all the pages, load the canvas, and render them
        for (var i = 0; i < pnum; i++) {
            load(i);
            render(i+1);
        }

        // Go back to the last one
        self.page.locate(pnum);
    }

    // The pdf page public api
    this.page = {

            // Find and the reset the view to this page
            locate: function (val) {
                var target = frame.children[val-1];
                if (target !== undefined) target.scrollIntoView();
                return val;
            },

            // Return the page number of the "head"
            get number () { return pnum },

            set number (val) {
                val = (val > self.page.last) ? self.page.last : val;
                if (val > pnum) {
                    do {
                        pnum++;
                        createNextFrame();
                        load();
                        render();
                    } while (pnum < val);
                }
                // return self.page.locate(val);
            },

            // Get the number of the last page in the document
            get last () { return self.doc.numPages },

            // Get the page number of the "head"
            get head () { return pnum },

            // Get the current page scale
            get scale () { return pscale },

            // Set the chosen scale, re-render everything accordingly
            set scale (val) {
                pscale = val;
                self.reload();
            }
    };
};


//The PdfRead object is a browser-aware reading device that the User will
//manipulate to read the page. Basically, a wrapper around the PdfView object.

var PdfReader = function (url) {
    "use strict";

    var frame = document.getElementById('pdf-viewer');

    var zoom_widget = document.getElementById('pdf-page-zoom');

    // Keep track of certain values inside the most interesting nodes of the DOM
    var state = {

            get ctop () { return frame.lastChild.offsetTop },

            get ftop () { return frame.scrollTop },

            get fsh () { return frame.scrollHeight },

            get fh () { return frame.offsetHeight },
    };

    // Get and store a pdf viewer
    var doc = new PdfViewer(url);

    // Decrease the Zoom, acting on the scale
    this.zoomMinus = function (val) {
        doc.page.scale -= (val) ? val : 0.25;
        zoom_widget.innerText = doc.page.scale * 100;
    };

    // Increase the Zoom, acting on the scale
    this.zoomPlus = function (val) {
        doc.page.scale += (val) ? val : 0.25;
        zoom_widget.innerText = doc.page.scale * 100;
    };

    // Controller: monitor for frame scroll events and advance page rendering
    frame.onscroll = function () {
        var test = (state.fsh - (state.fh + state.ftop));
        if (test < 0 && doc.page.head < doc.page.last) {
            doc.page.number++; 
        }
    };

    // Init the widgets
    zoom_widget.innerText = doc.page.scale * 100;
}