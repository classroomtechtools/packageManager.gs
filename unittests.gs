function testing_<?= data.namespace.replace('.', '_'); ?>() {
  var ut = pkg.utgs();
  
  (function UnitTests (ut) {

      ut.describe("Something", function () {
        ut.it("should do something", function () {
          var me;
          me = <?= data.prefix + data.namespace ?>();
          ut.assertObjectEquals({
            expected: {},
            actual: me
          });
        });

      });

  })(ut);
  
  return ut.result;  // returns true if all tests passed, false if not
}
