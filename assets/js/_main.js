/* ==========================================================================
   Various functions that we want to use within the template
   ========================================================================== */

// Follow the browser/OS color preference. The site deliberately has no manual
// theme switch, so a previously stored choice must not override the system.
const userPref = window.matchMedia('(prefers-color-scheme: dark)');

let determineComputedTheme = () => userPref.matches ? "dark" : "light";

/* ==========================================================================
   Plotly integration script so that Markdown codeblocks will be rendered
   ========================================================================== */

// Read the Plotly data from the code block, hide it, and render the chart as new node. This allows for the 
// JSON data to be retrieve when the theme is switched. The listener should only be added if the data is 
// actually present on the page.
import { plotlyDarkLayout, plotlyLightLayout } from './theme.js';
let plotlyElements = document.querySelectorAll("pre>code.language-plotly");
if (plotlyElements.length > 0) {
  document.addEventListener("readystatechange", () => {
    if (document.readyState === "complete") {
      plotlyElements.forEach((elem) => {
        // Parse the Plotly JSON data and hide it
        var jsonData = JSON.parse(elem.textContent);
        elem.parentElement.classList.add("hidden");

        // Add the Plotly node
        let chartElement = document.createElement("div");
        elem.parentElement.after(chartElement);

        // Set the theme for the plot and render it
        const theme = (determineComputedTheme() === "dark") ? plotlyDarkLayout : plotlyLightLayout;
        if (jsonData.layout) {
          jsonData.layout.template = (jsonData.layout.template) ? { ...theme, ...jsonData.layout.template } : theme;
        } else {
          jsonData.layout = { template: theme };
        }
        Plotly.react(chartElement, jsonData.data, jsonData.layout);
      });
    }
  });
}

/* ==========================================================================
   Actions that should occur when the page has been fully loaded
   ========================================================================== */

$(document).ready(function () {
  // SCSS SETTINGS - These should be the same as the settings in the relevant files 
  const sidebarCollapseWidth = 1024; // pixels, from the custom sidebar layout
  const scssMastheadHeight = 70;  // pixels, from the current theme (e.g., /_sass/theme/_default.scss)

  // Enable the sticky footer
  var bumpIt = function () {
    $("body").css("margin-bottom", $(".page__footer").outerHeight(true));
  }
  $(window).resize(function () {
    didResize = true;
  });
  setInterval(function () {
    if (didResize) {
      didResize = false;
      bumpIt();
    }}, 250);
  var didResize = false;
  bumpIt();

  // FitVids init
  fitvids();

  // Follow menu drop down
  var $authorUrlsWrapper = $(".author__urls-wrapper");
  var $authorUrlsButton = $authorUrlsWrapper.find("button");
  var $authorUrls = $authorUrlsWrapper.find(".author__urls");
  var authorUrlsAreCollapsible = function () {
    return $(window).width() < sidebarCollapseWidth;
  };

  var closeAuthorUrls = function () {
    // On wider screens the links are part of the permanent sidebar.
    if (!authorUrlsAreCollapsible()) return;

    $authorUrls.stop(true, true).fadeOut("fast");
    $authorUrlsButton.removeClass("open").attr("aria-expanded", "false");
  };

  $authorUrlsButton.on("click", function (event) {
    event.stopPropagation();

    var willOpen = $(this).attr("aria-expanded") !== "true";
    $authorUrls.stop(true, true)[willOpen ? "fadeIn" : "fadeOut"]("fast");
    $(this).toggleClass("open", willOpen).attr("aria-expanded", String(willOpen));
  });

  // Keep clicks within the menu from being treated as outside clicks.
  $authorUrls.on("click", function (event) {
    event.stopPropagation();
  });

  $authorUrls.find("a").on("click", closeAuthorUrls);

  $(document).on("click", function (event) {
    if (!$(event.target).closest(".author__urls-wrapper").length) {
      closeAuthorUrls();
    }
  });

  $(document).on("keydown", function (event) {
    if (event.key === "Escape" && $authorUrls.is(":visible")) {
      closeAuthorUrls();
      $authorUrlsButton.trigger("focus");
    }
  });

  // Restore the follow menu if toggled on a window resize
  jQuery(window).on('resize', function () {
    if (!authorUrlsAreCollapsible()) {
      $authorUrls.stop(true, true).css('display', 'block');
      $authorUrlsButton.removeClass("open").attr("aria-expanded", "false");
    } else if ($authorUrlsButton.attr("aria-expanded") !== "true") {
      $authorUrls.stop(true, true).css('display', 'none');
    }
  });

  // Init smooth scroll, this needs to be slightly more than then fixed masthead height
  $("a").smoothScroll({
    offset: -scssMastheadHeight,
    preventDefault: false,
  });

});
