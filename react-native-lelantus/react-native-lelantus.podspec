require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-lelantus"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.description  = <<-DESC
                  react-native-lelantus
                   DESC
  s.homepage     = "https://github.com/github_account/react-native-lelantus"
  s.license      = "MIT"
  # s.license    = { :type => "MIT", :file => "FILE_LICENSE" }
  s.authors      = { "Your Name" => "yourname@email.com" }
  s.platforms    = { :ios => "11.0" }
  s.source       = { :git => "https://github.com/github_account/react-native-lelantus.git", :tag => "#{s.version}" }

  s.source_files = ["ios/*.{h,m,mm,hpp,cpp,swift}", "ios/liblelantus/src/include/*.{h,hpp}", "ios/liblelantus/src/*.{h,c,hpp,cpp}",
  "ios/liblelantus/secp256k1/include/*.{h,hpp}", "ios/liblelantus/bitcoin/**/*.{h,c,hpp,cpp}", "ios/openssl/*.{h}"]
  s.requires_arc = true

  s.xcconfig = { 'USER_HEADER_SEARCH_PATHS' => '"$(SRCROOT)/../../node_modules/react-native-lelantus/ios"/**',
                  'ALWAYS_SEARCH_USER_PATHS' => 'YES',
                  'LIBRARY_SEARCH_PATHS' => '$(SRCROOT)/../node_modules/react-native-lelantus/ios' }

  s.library = 'secp'
  s.vendored_libraries = 'ios/libsecp.a', 'ios/libssl.a', 'ios/libcrypto.a'

  s.dependency "React"
  # ...
  # s.dependency "..."
end

