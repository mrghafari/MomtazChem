import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Search, RefreshCw } from "lucide-react";

export default function WalletDebugTest() {
  const [customerId, setCustomerId] = useState("5"); // Default to oilstar
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostic = async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch(`/api/debug/wallet-discrepancy/${customerId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setResults(data);
      
    } catch (err: any) {
      setError(err.message || 'Failed to run diagnostic');
      console.error('Diagnostic error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: string | number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔍 Wallet Discrepancy Diagnostic Tool
          </h1>
          <p className="text-gray-600">
            Debug wallet balance discrepancies between customer and admin interfaces
          </p>
        </div>

        {/* Input Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Run Diagnostic Test</CardTitle>
            <CardDescription>
              Enter customer ID to investigate wallet data discrepancies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 mb-1">
                  Customer ID
                </label>
                <Input
                  id="customerId"
                  type="number"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  placeholder="Enter customer ID (e.g., 5 for oilstar)"
                />
              </div>
              <Button 
                onClick={runDiagnostic} 
                disabled={isLoading || !customerId}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Run Diagnostic
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Diagnostic Failed</span>
              </div>
              <p className="mt-2 text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Results Display */}
        {results && (
          <div className="space-y-6">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {results.data.customer ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Name:</span>
                      <p>{results.data.customer.firstName} {results.data.customer.lastName}</p>
                    </div>
                    <div>
                      <span className="font-medium">Email:</span>
                      <p>{results.data.customer.email}</p>
                    </div>
                    <div>
                      <span className="font-medium">Customer ID:</span>
                      <p>{results.data.customerId}</p>
                    </div>
                    <div>
                      <span className="font-medium">Diagnostic Time:</span>
                      <p>{new Date(results.data.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-red-600">Customer not found</p>
                )}
              </CardContent>
            </Card>

            {/* Analysis Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Analysis Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <Badge variant={results.data.analysis.hasWallet ? "default" : "destructive"}>
                      {results.data.analysis.hasWallet ? "Has Wallet" : "No Wallet"}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-1">Wallet Record</p>
                  </div>
                  <div className="text-center">
                    <Badge variant={results.data.analysis.hasTransactions ? "default" : "secondary"}>
                      {results.data.analysis.hasTransactions ? "Has Transactions" : "No Transactions"}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-1">Transaction History</p>
                  </div>
                  <div className="text-center">
                    <Badge variant={results.data.analysis.hasRecharges ? "default" : "secondary"}>
                      {results.data.analysis.hasRecharges ? "Has Recharges" : "No Recharges"}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-1">Recharge Requests</p>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-lg">
                      {formatAmount(results.data.analysis.calculatedBalance)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Calculated Balance</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Direct Database Results */}
            <Card>
              <CardHeader>
                <CardTitle>Direct Database Queries</CardTitle>
                <CardDescription>Raw data from database tables</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Wallet Table:</h4>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                      {JSON.stringify(results.data.directQueries.wallet, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Transactions (Last 10):</h4>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                      {JSON.stringify(results.data.directQueries.transactions, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Recharge Requests (Last 5):</h4>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                      {JSON.stringify(results.data.directQueries.recharges, null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Storage Method Results */}
            <Card>
              <CardHeader>
                <CardTitle>Wallet Storage Methods</CardTitle>
                <CardDescription>Results from backend storage methods</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Balance Method Result:</h4>
                    <p className="text-lg font-medium">
                      {formatAmount(results.data.storageResults.balance)}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Wallet Summary Method:</h4>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                      {JSON.stringify(results.data.storageResults.summary, null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Instructions */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">How to Use This Tool</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700">
            <ol className="list-decimal list-inside space-y-2">
              <li>Enter the customer ID you want to investigate (5 = oilstar)</li>
              <li>Click "Run Diagnostic" to fetch comprehensive wallet data</li>
              <li>Review the analysis summary to see if wallet records exist</li>
              <li>Check direct database queries vs storage method results</li>
              <li>Compare these results with what customer/admin interfaces show</li>
            </ol>
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded">
              <p className="text-yellow-800 font-medium">
                💡 Expected Results for oilstar: All values should be 0 or empty since database contains no data
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}