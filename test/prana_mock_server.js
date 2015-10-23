var mockserver  =  require('mockserver');
var http = require('http')
http.createServer(mockserver('./test/mocks')).listen(process.argv[2]);