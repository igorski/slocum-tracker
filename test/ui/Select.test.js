/**
 * Created by igorzinken on 18-03-16.
 */
var chai        = require( "chai" );
var MockBrowser = require( "mock-browser" ).mocks.MockBrowser;
var Select      = require( "../../src/js/ui/Select" );

describe( "Select", () =>
{
    /* setup */

    // use Chai assertion library
    var assert = chai.assert,
        expect = chai.expect;

    var browser, options, element;

    // executed before the tests start running

    before( () =>
    {
        browser         = new MockBrowser();
        global.document = browser.getDocument();

        options = [
            { title: "foo", value: "value for foo" },
            { title: "bar", value: "value for bar" },
            { title: "baz", value: "value for baz" },
            { title: "qux", value: "value for qux" }
        ];

        element = global.document.createElement( "div" );
    });

    // executed when all tests have finished running

    after( () =>
    {

    });

    // executed before each individual test

    beforeEach( () =>
    {

    });

    // executed after each individual test

    afterEach( () =>
    {

    });

    /* actual unit tests */

    it( "should construct without supplying options", () =>
    {
        var select = new Select( element );

        assert.notOk( select.hasOptions(),
            "expected Select not to have options if none were passed during construction" );
    });

    it( "should construct without supplying options", () =>
    {
        var select = new Select( element, null, options );

        assert.ok( select.hasOptions(),
            "expected Select to have options as these were supplied during construction" );
    });

    it( "should be able to update its options after construction", () =>
    {
        var select = new Select( element );

        select.setOptions( options );

        assert.ok( select.hasOptions(),
            "expected Select to have options as these were supplied during construction" );
    });

    it( "should by default select the first available option after setting options", () =>
    {
        var select = new Select( element );

        select.setOptions( options );

        assert.strictEqual( options[0].value, select.getValue(),
            "expected Select to have set its value to the first available option" );
    });

    it( "should be able to update its selected value", () =>
    {
        var select = new Select( element );

        select.setOptions( options );
        select.setValue( options[1].value );

        assert.strictEqual( options[1].value, select.getValue(),
            "expected Select to have updated its value to the correct option" );

        select.setValue( "foo" );

        assert.strictEqual( options[1].value, select.getValue(),
            "expected Select to have maintained its value after having been requested to set itself to a" +
            "not available value" );
    });

    it( "should be able to update its selected value by the first character of the value", () =>
    {
        var select = new Select( element, null, options );

        // expect second option "bar"
        select.setValueByFirstLetter( "b" );

        assert.strictEqual( options[1].value, select.getValue(),
            "expected Select to have jumped to the first value matching the letter 'b'" );

        // expect third option "baz"
        select.setValueByFirstLetter( "b" );

        assert.strictEqual( options[2].value, select.getValue(),
            "expected Select to have jumped to the second value matching the letter 'b'" );

        // expect fourth option "qux"
        select.setValueByFirstLetter( "q" );

        assert.strictEqual( options[3].value, select.getValue(),
            "expected Select to have jumped to the first value matching the letter 'q'" );

        // expect first option "foo"
        select.setValueByFirstLetter( "f" );

        assert.strictEqual( options[0].value, select.getValue(),
            "expected Select to have jumped to the first value matching the letter 'f'" );
    });

    it( "should invoke its complete handler upon changing its values", function( done )
    {
        var select = new Select( element, done, options );
        select.setValue( options[1].value );
    });

    it( "should be able to collect values if it is constructed for an existing HTML template", () =>
    {
        var html             = "<ul><li data-value='foo'>foo</li><li data-value='bar'>bar</li></ul>";
        var templatedElement = global.document.createElement( "div" );
        templatedElement.innerHTML = html;

        var select = new Select( templatedElement );

        assert.ok( select.hasOptions(),
            "expected Select to have options if it is constructed with an HTML template" );

        assert.strictEqual( "foo", select.getValue(),
            "expected Selects default value to equal the first value described in the HTML template" );
    });

    it( "should be able to know its enabled state", () =>
    {
        var select = new Select( element, null, options );

        assert.notOk( select.isEnabled(),
            "expected Select not to be enabled after construction" );

        select.setEnabled( true );

        assert.ok( select.isEnabled(),
            "expected Select to be enabled after invocation" );

        select.setEnabled( false );

        assert.notOk( select.isEnabled(),
            "expected Select not to be enabled after invocation" );
    });

    it( "should be able to know set and unset its focus", () =>
    {
        var select = new Select( element, null, options );

        assert.notOk( select.isFocused(),
            "expected Select not to be focused after construction" );

        select.focus();

        assert.ok( select.isFocused(),
            "expected Select to be focused after invocation of focus" );

        select.blur();

        assert.notOk( select.isFocused(),
            "expected Select not to be focused after invocation of blur" );
    });

    it( "should be able to know whether it is opened or closed", () =>
    {
        var select = new Select( element, null, options );

        assert.notOk( select.isOpen(),
            "expected Select not to be opened after construction" );

        select.open();

        assert.ok( select.isOpen(),
            "expected Select to be opened after invocation of open" );

        select.close();

        assert.notOk( select.isOpen(),
            "expected Select not to be closed after invocation of close" );
    });
});
