"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""


"""
 The private key should not leave the location where it was generated. But in datacenter environment it may be desirable
 to store the certificate in a central certificate store and move around different machines in the datacenter. Like a
 webserver machine may be redeployed completely and we may need to copy the private key to that new machine. In order
 to securely do this securely, the deployment service may generate a set of keys dep_priv_key, dep_pub_key and send the
 public key to the certificate manager. The certificate manager should verify requesting machines integrity and encrypt
 the private ker with supplied public key of the client. This can be done using already established protocol like
 HTTPS using a client certificate to verify the client.

"""