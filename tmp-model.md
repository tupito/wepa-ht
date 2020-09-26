Reservation
* id (ORM???)
* start (DATETIME)
* end (DATETIME)
* customer-id (int)
* service-provider-id (int)

customer
* id
* name

Service-provider
* id
* name


```
customer 1-* Reservation
Service-provider 1-* Reservation

* customerilla ei päällekkäisiä varauksia
* service-providerilla ei päällekkäisiä varauksia
```

```
hardcoded inserts:
* 2 x customer (L. Palmer, D. Cooper)
* 1 x service-provider (Dr. Jacob)
* ? x reservation
```